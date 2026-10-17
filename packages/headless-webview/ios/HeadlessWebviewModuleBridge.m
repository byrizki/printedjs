#import <React/RCTBridgeModule.h>

__attribute__((visibility("default"))) void * __swift_FORCE_LOAD_$_swiftCompatibility56_$_react_native_headless_webview = 0;
__attribute__((visibility("default"))) void * __swift_FORCE_LOAD_$_swiftCompatibility51_$_react_native_headless_webview = 0;

@interface RCT_EXTERN_MODULE(HeadlessWebviewModule, NSObject)

RCT_EXTERN_METHOD(createInstance:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(loadHtml:(NSString *)instanceId
                  html:(NSString *)html
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(loadUrl:(NSString *)instanceId
                  url:(NSString *)url
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(evalScript:(NSString *)instanceId
                  script:(NSString *)script
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(printToPdf:(NSString *)instanceId
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(printToPdfFile:(NSString *)instanceId
                  filePath:(NSString *)filePath
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(destroyInstance:(NSString *)instanceId
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
