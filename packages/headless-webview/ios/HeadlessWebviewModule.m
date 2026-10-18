#import "HeadlessWebviewModule.h"
#import <React/RCTUtils.h>

@implementation HeadlessWebviewModule {
  NSMutableDictionary<NSString *, WKWebView *> *_webviews;
  NSMutableDictionary<NSString *, NSMutableArray<void (^)(NSError *)> *> *_pendingNavigations;
  NSMutableDictionary<NSString *, dispatch_block_t> *_navigationTimeouts;
  NSMutableDictionary<NSString *, NSNumber *> *_loadingStates;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (instancetype)init
{
  if (self = [super init]) {
    _webviews = [NSMutableDictionary dictionary];
    _pendingNavigations = [NSMutableDictionary dictionary];
    _navigationTimeouts = [NSMutableDictionary dictionary];
    _loadingStates = [NSMutableDictionary dictionary];
  }
  return self;
}

#pragma mark - Navigation Helper Methods

- (NSString *)instanceIdForWebView:(WKWebView *)webView
{
  for (NSString *key in _webviews.allKeys) {
    if (_webviews[key] == webView) {
      return key;
    }
  }
  return nil;
}

- (void)dispatchNavigationForInstanceId:(NSString *)instanceId error:(NSError *)error
{
  dispatch_block_t timeoutBlock = _navigationTimeouts[instanceId];
  if (timeoutBlock) {
    dispatch_block_cancel(timeoutBlock);
    [_navigationTimeouts removeObjectForKey:instanceId];
  }
  _loadingStates[instanceId] = @(NO);

  NSArray<void (^)(NSError *)> *callbacks = [_pendingNavigations[instanceId] copy];
  [_pendingNavigations removeObjectForKey:instanceId];
  if (callbacks) {
    for (void (^callback)(NSError *) in callbacks) {
      callback(error);
    }
  }
}

- (void)waitForNavigationForInstanceId:(NSString *)instanceId
                               timeout:(NSTimeInterval)timeout
                            completion:(void (^)(NSError *))completion
{
  NSMutableArray<void (^)(NSError *)> *callbacks = _pendingNavigations[instanceId];
  if (!callbacks) {
    callbacks = [NSMutableArray array];
    _pendingNavigations[instanceId] = callbacks;
  }
  [callbacks addObject:[completion copy]];

  if (!_navigationTimeouts[instanceId]) {
    __weak typeof(self) weakSelf = self;
    dispatch_block_t timeoutBlock = dispatch_block_create(0, ^{
      __strong typeof(weakSelf) strongSelf = weakSelf;
      if (strongSelf) {
        NSError *err = [NSError errorWithDomain:@"HeadlessWebviewModule"
                                           code:-1001
                                       userInfo:@{
          NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Navigation timed out after %.1fs", timeout]
        }];
        [strongSelf dispatchNavigationForInstanceId:instanceId error:err];
      }
    });
    _navigationTimeouts[instanceId] = timeoutBlock;
    dispatch_after(
      dispatch_time(DISPATCH_TIME_NOW, (int64_t)(timeout * NSEC_PER_SEC)),
      dispatch_get_main_queue(),
      timeoutBlock
    );
  }
}

#pragma mark - WKNavigationDelegate

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation
{
  NSString *iid = [self instanceIdForWebView:webView];
  if (iid) {
    [self dispatchNavigationForInstanceId:iid error:nil];
  }
}

- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error
{
  NSString *iid = [self instanceIdForWebView:webView];
  if (iid) {
    [self dispatchNavigationForInstanceId:iid error:error];
  }
}

- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(WKNavigation *)navigation withError:(NSError *)error
{
  NSString *iid = [self instanceIdForWebView:webView];
  if (iid) {
    [self dispatchNavigationForInstanceId:iid error:error];
  }
}

#pragma mark - RCTBridgeModule Methods

RCT_EXPORT_METHOD(createInstance:(NSDictionary *)config
                        resolver:(RCTPromiseResolveBlock)resolve
                        rejecter:(RCTPromiseRejectBlock)reject)
{
  if (![config isKindOfClass:[NSDictionary class]]) {
    config = @{};
  }

  NSString *instanceId = [[NSUUID UUID] UUIDString];
  WKWebViewConfiguration *configuration = [[WKWebViewConfiguration alloc] init];

  NSArray<NSString *> *scripts = config[@"initializationScripts"];
  if ([scripts isKindOfClass:[NSArray class]]) {
    for (NSString *script in scripts) {
      if ([script isKindOfClass:[NSString class]]) {
        WKUserScript *userScript = [[WKUserScript alloc] initWithSource:script
                                                          injectionTime:WKUserScriptInjectionTimeAtDocumentStart
                                                       forMainFrameOnly:YES];
        [configuration.userContentController addUserScript:userScript];
      }
    }
  }

  // Headless: zero frame, not added to any view hierarchy
  WKWebView *webview = [[WKWebView alloc] initWithFrame:CGRectZero configuration:configuration];
  webview.navigationDelegate = self;

  NSNumber *transparent = config[@"transparent"];
  if ([transparent isKindOfClass:[NSNumber class]] && [transparent boolValue]) {
    webview.opaque = NO;
    webview.backgroundColor = [UIColor clearColor];
    webview.scrollView.backgroundColor = [UIColor clearColor];
  }

  NSString *userAgent = config[@"userAgent"];
  if ([userAgent isKindOfClass:[NSString class]]) {
    webview.customUserAgent = userAgent;
  }

  _webviews[instanceId] = webview;

  NSString *html = config[@"html"];
  NSString *urlString = config[@"url"];

  if ([html isKindOfClass:[NSString class]]) {
    _loadingStates[instanceId] = @(YES);
    [self waitForNavigationForInstanceId:instanceId timeout:15.0 completion:^(NSError *error) {
      if (error) {
        reject(@"LOAD_ERROR", error.localizedDescription, error);
      } else {
        resolve(instanceId);
      }
    }];
    [webview loadHTMLString:html baseURL:nil];
  } else if ([urlString isKindOfClass:[NSString class]]) {
    NSURL *url = [NSURL URLWithString:urlString];
    if (url) {
      _loadingStates[instanceId] = @(YES);
      [self waitForNavigationForInstanceId:instanceId timeout:15.0 completion:^(NSError *error) {
        if (error) {
          reject(@"LOAD_ERROR", error.localizedDescription, error);
        } else {
          resolve(instanceId);
        }
      }];
      [webview loadRequest:[NSURLRequest requestWithURL:url]];
    } else {
      reject(@"INVALID_URL", [NSString stringWithFormat:@"Invalid URL: %@", urlString], nil);
    }
  } else {
    resolve(instanceId);
  }
}

RCT_EXPORT_METHOD(loadHtml:(NSString *)instanceId
                      html:(NSString *)html
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  WKWebView *webview = _webviews[instanceId];
  if (!webview) {
    reject(@"NOT_FOUND", [NSString stringWithFormat:@"Headless webview instance not found: %@", instanceId], nil);
    return;
  }

  _loadingStates[instanceId] = @(YES);
  [self waitForNavigationForInstanceId:instanceId timeout:15.0 completion:^(NSError *error) {
    if (error) {
      reject(@"LOAD_ERROR", error.localizedDescription, error);
    } else {
      resolve([NSNull null]);
    }
  }];
  [webview loadHTMLString:html baseURL:nil];
}

RCT_EXPORT_METHOD(loadUrl:(NSString *)instanceId
                      url:(NSString *)urlString
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  WKWebView *webview = _webviews[instanceId];
  if (!webview) {
    reject(@"NOT_FOUND", [NSString stringWithFormat:@"Headless webview instance not found: %@", instanceId], nil);
    return;
  }

  NSURL *url = [NSURL URLWithString:urlString];
  if (!url) {
    reject(@"INVALID_URL", [NSString stringWithFormat:@"Invalid URL: %@", urlString], nil);
    return;
  }

  _loadingStates[instanceId] = @(YES);
  [self waitForNavigationForInstanceId:instanceId timeout:15.0 completion:^(NSError *error) {
    if (error) {
      reject(@"LOAD_ERROR", error.localizedDescription, error);
    } else {
      resolve([NSNull null]);
    }
  }];
  [webview loadRequest:[NSURLRequest requestWithURL:url]];
}

RCT_EXPORT_METHOD(evalScript:(NSString *)instanceId
                      script:(NSString *)script
                    resolver:(RCTPromiseResolveBlock)resolve
                    rejecter:(RCTPromiseRejectBlock)reject)
{
  WKWebView *webview = _webviews[instanceId];
  if (!webview) {
    reject(@"NOT_FOUND", [NSString stringWithFormat:@"Headless webview instance not found: %@", instanceId], nil);
    return;
  }

  void (^executeEval)(void) = ^{
    [webview evaluateJavaScript:script completionHandler:^(id result, NSError *error) {
      if (error) {
        reject(@"EVAL_ERROR", error.localizedDescription, error);
      } else {
        if (result == nil || [result isKindOfClass:[NSNull class]]) {
          resolve(@"");
        } else if ([result isKindOfClass:[NSString class]]) {
          resolve(result);
        } else {
          resolve([NSString stringWithFormat:@"%@", result]);
        }
      }
    }];
  };

  if ([_loadingStates[instanceId] boolValue] || webview.isLoading) {
    [self waitForNavigationForInstanceId:instanceId timeout:15.0 completion:^(NSError *error) {
      if (error) {
        reject(@"EVAL_ERROR", error.localizedDescription, error);
      } else {
        executeEval();
      }
    }];
  } else {
    executeEval();
  }
}

RCT_EXPORT_METHOD(printToPdf:(NSString *)instanceId
                     options:(NSDictionary *)options
                    resolver:(RCTPromiseResolveBlock)resolve
                    rejecter:(RCTPromiseRejectBlock)reject)
{
  WKWebView *webview = _webviews[instanceId];
  if (!webview) {
    reject(@"NOT_FOUND", [NSString stringWithFormat:@"Headless webview instance not found: %@", instanceId], nil);
    return;
  }

  NSDictionary *pdfOptions = [options isKindOfClass:[NSDictionary class]] ? options : @{};

  __weak typeof(self) weakSelf = self;
  void (^executePrint)(void) = ^{
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf) return;

    if (@available(iOS 14.0, *)) {
      WKPDFConfiguration *pdfConfig = [[WKPDFConfiguration alloc] init];
      double pageWidth = [pdfOptions[@"pageWidth"] respondsToSelector:@selector(doubleValue)] ? [pdfOptions[@"pageWidth"] doubleValue] : 8.27;
      double pageHeight = [pdfOptions[@"pageHeight"] respondsToSelector:@selector(doubleValue)] ? [pdfOptions[@"pageHeight"] doubleValue] : 11.69;
      BOOL landscape = [pdfOptions[@"landscape"] respondsToSelector:@selector(boolValue)] ? [pdfOptions[@"landscape"] boolValue] : NO;

      double width = pageWidth * 72.0;
      double height = pageHeight * 72.0;

      pdfConfig.rect = CGRectMake(0, 0, landscape ? height : width, landscape ? width : height);

      [webview createPDFWithConfiguration:pdfConfig completionHandler:^(NSData *pdfData, NSError *error) {
        if (error) {
          reject(@"PDF_ERROR", error.localizedDescription, error);
        } else {
          NSString *base64String = [pdfData base64EncodedStringWithOptions:0];
          resolve(base64String);
        }
      }];
    } else {
      NSData *data = [strongSelf renderPdfLegacyWithWebview:webview options:pdfOptions];
      NSString *base64String = [data base64EncodedStringWithOptions:0];
      resolve(base64String);
    }
  };

  if ([_loadingStates[instanceId] boolValue] || webview.isLoading) {
    [self waitForNavigationForInstanceId:instanceId timeout:15.0 completion:^(NSError *error) {
      if (error) {
        reject(@"PDF_ERROR", error.localizedDescription, error);
      } else {
        executePrint();
      }
    }];
  } else {
    executePrint();
  }
}

RCT_EXPORT_METHOD(printToPdfFile:(NSString *)instanceId
                        filePath:(NSString *)filePath
                         options:(NSDictionary *)options
                        resolver:(RCTPromiseResolveBlock)resolve
                        rejecter:(RCTPromiseRejectBlock)reject)
{
  WKWebView *webview = _webviews[instanceId];
  if (!webview) {
    reject(@"NOT_FOUND", [NSString stringWithFormat:@"Headless webview instance not found: %@", instanceId], nil);
    return;
  }

  NSDictionary *pdfOptions = [options isKindOfClass:[NSDictionary class]] ? options : @{};

  __weak typeof(self) weakSelf = self;
  void (^executePrintFile)(void) = ^{
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf) return;

    void (^writePdfData)(NSData *) = ^(NSData *data) {
      NSString *parentDir = [filePath stringByDeletingLastPathComponent];
      if (parentDir.length > 0) {
        NSError *dirError = nil;
        [[NSFileManager defaultManager] createDirectoryAtPath:parentDir withIntermediateDirectories:YES attributes:nil error:&dirError];
        if (dirError) {
          reject(@"IO_ERROR", dirError.localizedDescription, dirError);
          return;
        }
      }
      NSError *writeError = nil;
      [data writeToFile:filePath options:NSDataWritingAtomic error:&writeError];
      if (writeError) {
        reject(@"IO_ERROR", writeError.localizedDescription, writeError);
      } else {
        resolve([NSNull null]);
      }
    };

    if (@available(iOS 14.0, *)) {
      WKPDFConfiguration *pdfConfig = [[WKPDFConfiguration alloc] init];
      double pageWidth = [pdfOptions[@"pageWidth"] respondsToSelector:@selector(doubleValue)] ? [pdfOptions[@"pageWidth"] doubleValue] : 8.27;
      double pageHeight = [pdfOptions[@"pageHeight"] respondsToSelector:@selector(doubleValue)] ? [pdfOptions[@"pageHeight"] doubleValue] : 11.69;
      BOOL landscape = [pdfOptions[@"landscape"] respondsToSelector:@selector(boolValue)] ? [pdfOptions[@"landscape"] boolValue] : NO;

      double width = pageWidth * 72.0;
      double height = pageHeight * 72.0;

      pdfConfig.rect = CGRectMake(0, 0, landscape ? height : width, landscape ? width : height);

      [webview createPDFWithConfiguration:pdfConfig completionHandler:^(NSData *pdfData, NSError *error) {
        if (error) {
          reject(@"PDF_ERROR", error.localizedDescription, error);
        } else {
          writePdfData(pdfData);
        }
      }];
    } else {
      NSData *data = [strongSelf renderPdfLegacyWithWebview:webview options:pdfOptions];
      writePdfData(data);
    }
  };

  if ([_loadingStates[instanceId] boolValue] || webview.isLoading) {
    [self waitForNavigationForInstanceId:instanceId timeout:15.0 completion:^(NSError *error) {
      if (error) {
        reject(@"PDF_ERROR", error.localizedDescription, error);
      } else {
        executePrintFile();
      }
    }];
  } else {
    executePrintFile();
  }
}

- (NSData *)renderPdfLegacyWithWebview:(WKWebView *)webview options:(NSDictionary *)options
{
  double pageWidth = [options[@"pageWidth"] respondsToSelector:@selector(doubleValue)] ? [options[@"pageWidth"] doubleValue] : 8.27;
  double pageHeight = [options[@"pageHeight"] respondsToSelector:@selector(doubleValue)] ? [options[@"pageHeight"] doubleValue] : 11.69;
  BOOL landscape = [options[@"landscape"] respondsToSelector:@selector(boolValue)] ? [options[@"landscape"] boolValue] : NO;

  double width = pageWidth * 72.0;
  double height = pageHeight * 72.0;
  CGRect pageRect = CGRectMake(0, 0, landscape ? height : width, landscape ? width : height);

  webview.frame = pageRect;

  UIViewPrintFormatter *printFormatter = [webview viewPrintFormatter];
  UIPrintPageRenderer *renderer = [[UIPrintPageRenderer alloc] init];
  [renderer addPrintFormatter:printFormatter startingAtPageAtIndex:0];
  [renderer setValue:[NSValue valueWithCGRect:pageRect] forKey:@"paperRect"];
  [renderer setValue:[NSValue valueWithCGRect:pageRect] forKey:@"printableRect"];

  NSMutableData *pdfData = [NSMutableData data];
  UIGraphicsBeginPDFContextToData(pdfData, pageRect, nil);
  for (NSInteger i = 0; i < renderer.numberOfPages; i++) {
    UIGraphicsBeginPDFPage();
    [renderer drawPageAtIndex:i inRect:UIGraphicsGetPDFContextBounds()];
  }
  UIGraphicsEndPDFContext();

  return pdfData;
}

RCT_EXPORT_METHOD(destroyInstance:(NSString *)instanceId
                         resolver:(RCTPromiseResolveBlock)resolve
                         rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_block_t timeoutBlock = _navigationTimeouts[instanceId];
  if (timeoutBlock) {
    dispatch_block_cancel(timeoutBlock);
    [_navigationTimeouts removeObjectForKey:instanceId];
  }
  [_pendingNavigations removeObjectForKey:instanceId];
  [_loadingStates removeObjectForKey:instanceId];

  WKWebView *webview = _webviews[instanceId];
  if (webview) {
    [_webviews removeObjectForKey:instanceId];
    [webview stopLoading];
    webview.navigationDelegate = nil;
  }
  resolve([NSNull null]);
}

@end
