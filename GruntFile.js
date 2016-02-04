module.exports = function (grunt) {  
    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);  
    // Project configuration.  
    grunt.initConfig({  
        pkg: grunt.file.readJSON('package.json'),  
        cssmin: {  
            sitecss: {  
                options: {  
                    banner: '/* My minified css file */'  
                },  
                files: {  
                    'css/site.min.css': []  
                }  
            }  
        },  
        uglify: {  
            options: {  
                compress: true  
            },  
            applib: {  
                src: [  
                'bower_components/jquery/dist/jquery.min.js',  
                'bower_components/snap.svg/dist/snap-svg.min.js'
                ],  
                dest: 'js/common.js'  
            }  
        }  
    });  
    // Default task.  
    grunt.registerTask('default', ['uglify', 'cssmin']);  
};