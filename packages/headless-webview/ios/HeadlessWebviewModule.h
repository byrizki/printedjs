#import <React/RCTBridgeModule.h>
#import <WebKit/WebKit.h>

@interface HeadlessWebviewModule : NSObject <RCTBridgeModule, WKNavigationDelegate>

@end
