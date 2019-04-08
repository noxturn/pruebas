module.exports = grunt => {
    grunt.loadNpmTasks('grunt-shell');
    grunt.initConfig({
        shell: {
            command: ['ls'].join('&&')
        }
    });
    grunt.registerTask('default', ['shell']);
    grunt.registerTask('getShops', function() {
        var shops = grunt.file.readYAML('config_env.yml');
        var configArray = [];
        var configString = '';
        for (let shop in shops){

            for (let env in shops[shop]) {

                configString += env;
                
                for (let attr in shops[shop][env]) {

                    if(attr == 'ignore_files'){

                        configString += '\n  ' + attr + ':' 

                        for (let file in shops[shop][env][attr]) {

                            if(shops[shop][env][attr][file].startsWith('*')){

                                configString += ' \n    - "' + shops[shop][env][attr][file] + '"';

                            } else {

                                configString += ' \n    - ' + shops[shop][env][attr][file];
                            }
                        }

                    } else {

                        configString += '\n  ' + attr + ': '+shops[shop][env][attr];
                    }
                }

                configString += '\n';
            }

            configArray[shop] = configString;

            grunt.file.write(`shops/${Object.keys(configArray)[0]}/config.yml`,configArray[shop]);

            configArray = [];
            configString = '';
        }
    });
}