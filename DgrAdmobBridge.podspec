Pod::Spec.new do |s|
  s.name = 'DgrAdmobBridge'
  s.version = '0.1.1'
  s.summary = 'Framework-agnostic Capacitor ads facade with a native ads bridge.'
  s.description = <<-DESC
    DgrAdmobBridge is a reusable Capacitor plugin that provides a framework-agnostic
    ads facade for standard AdMob flows, dependency guardrails for
    @capacitor-community/admob, and a native ads bridge contract for Android-first
    consumer apps with iOS contract compatibility in progress.
  DESC
  s.license = 'MIT'
  s.homepage = 'https://github.com/donugr/dgradmobbridge'
  s.author = 'donugr'
  s.source = { :git => 'https://github.com/donugr/dgradmobbridge.git', :tag => s.version.to_s }
  s.source_files = 'ios/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target = '14.0'
  s.swift_version = '5.9'
  s.requires_arc = true
  s.static_framework = true
  s.dependency 'Capacitor'
end
