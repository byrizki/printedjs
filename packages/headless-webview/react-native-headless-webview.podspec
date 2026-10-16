require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-headless-webview"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/byrizki/printedjs"
  s.license      = "MIT"
  s.authors      = { "PrintedJS Contributors" => "info@printedjs.dev" }
  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/byrizki/printedjs.git", :tag => "v#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.frameworks   = "WebKit", "PDFKit", "UIKit"

  # Bundled prebuilt native static library / XCFramework support (no on-the-fly compilation)
  s.vendored_frameworks = "ios/Frameworks/HeadlessWebViewCore.xcframework" if File.exist?(File.join(__dir__, "ios/Frameworks/HeadlessWebViewCore.xcframework"))
  s.vendored_libraries = "ios/Frameworks/libheadless_webview_core.a" if File.exist?(File.join(__dir__, "ios/Frameworks/libheadless_webview_core.a"))
  s.preserve_paths = "ios/Frameworks/*"

  # Use install_modules_dependencies if New Architecture is enabled in consumer Podfile
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
  s.swift_version = "5.0"
end
