basePath = '../';

files = [

  JASMINE,
  JASMINE_ADAPTER,

  'deps/angular.js/build/angular.js',
  'deps/angular.js/build/angular-loader.js',
  'deps/angular.js/build/angular-mocks.js',
  'deps/angular.js/test/matchers.js',

  'lib/fancyResource.js',
  'spec/fancyResource-spec.js'

];

autoWatch = true;
//singleRun = true

browsers = ['Chrome'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};
