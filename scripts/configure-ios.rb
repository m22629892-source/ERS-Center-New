require 'xcodeproj'
require 'fileutils'

path = 'ios/App/App'
plist = ARGV.fetch(0)
configuration = Xcodeproj::Plist.read_from_path(plist)
abort 'Firebase iOS Bundle ID must be com.ers.emergency' unless configuration['BUNDLE_ID'] == 'com.ers.emergency'
FileUtils.cp(plist, "#{path}/GoogleService-Info.plist")

project = Xcodeproj::Project.open('ios/App/App.xcodeproj')
target = project.targets.find { |item| item.name == 'App' }
target.add_resources([project.main_group['App'].new_file('GoogleService-Info.plist')])

package = project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
package.repositoryURL = 'https://github.com/firebase/firebase-ios-sdk.git'
package.requirement = { 'kind' => 'upToNextMajorVersion', 'minimumVersion' => '12.0.0' }
project.root_object.package_references << package
%w[FirebaseCore FirebaseMessaging].each do |name|
  product = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
  product.package = package
  product.product_name = name
  target.package_product_dependencies << product
  framework = project.new(Xcodeproj::Project::Object::PBXBuildFile)
  framework.product_ref = product
  target.frameworks_build_phase.files << framework
end

Xcodeproj::Plist.write_to_path({ 'aps-environment' => '$(APS_ENVIRONMENT)' }, "#{path}/App.entitlements")
target.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
  config.build_settings['APS_ENVIRONMENT'] = config.name == 'Debug' ? 'development' : 'production'
end
project.save

delegate = "#{path}/AppDelegate.swift"
source = File.read(delegate)
source.sub!("import Capacitor", "import Capacitor\nimport FirebaseCore\nimport FirebaseMessaging") or abort 'Capacitor import missing'
source.sub!(/(didFinishLaunchingWithOptions[^\n]+\{)/, "\\1\n        FirebaseApp.configure()") or abort 'Launch callback missing'
abort 'Push callbacks already exist' if source.include?('didRegisterForRemoteNotificationsWithDeviceToken')
source.insert(source.rindex('}'), <<~SWIFT.lines.map { |line| "    #{line}" }.join)
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
      Messaging.messaging().apnsToken = deviceToken
      Messaging.messaging().token { token, error in
          DispatchQueue.main.async {
              if let token = token {
                  NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: token)
              } else {
                  NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
              }
          }
      }
  }

  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
      NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
  }
SWIFT
File.write(delegate, source)
