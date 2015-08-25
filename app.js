var inputDir = process.argv[2];
var outputDir = process.argv[3];
if(!inputDir || !outputDir){
    console.log('Faltan parámetros: node app inputDir outputDir');
    process.exit();
}

var q = require('q');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var path = require('path');
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

var prFile=function(file){
    return new q.Promise(function(resolve,reject){
        var newFile = path.basename(file,'.mov');
        ffmpeg(file)
            .output(outputDir+'/'+newFile+'.avi')
            .on('end', function(e) {
                console.log('Procesado el vídeo '+newFile);
                resolve();
            })
            .on('error', function(err) {
                console.log('Error procesando el siguiente vídeo: ' + err.message);
                reject();
            })
            .run();
    });
};

var walk = function(dir, done) {
        var results = [];
        fs.readdir(dir, function(err, list) {
                if (err) return done(err);
                var i = 0;
                (function next() {
                        var file = list[i++];
                        if (!file) return done(null, results);
                        file = dir + '/' + file;
                        fs.stat(file, function(err, stat) {
                                if (stat && stat.isDirectory()) {
                                        walk(file, function(err, res) {
                                                results = results.concat(res);
                                                next();
                                        });
                                } else {
                                        if(path.extname(file)==='.mov')
                                            results.push(file);
                                        next();
                                }
                        });
                })();
        });
};

walk(__dirname,function(err,results){
    var promises = [];
    results.forEach(function(file){
        promises.push(prFile(file));
    });
    q.all(promises).then(function(){
       console.log('Proceso terminado');
    });
});