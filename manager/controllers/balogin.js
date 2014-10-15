module.exports = function(username, password, callback) {
    // return callback(null, usuario);
    
    var urlWsdl = "http://10.10.1.50/webservice/validar.php?wsdl";

    var soap = require('soap');
    var args = {
        email: username,
        clave: password
    };
    soap.createClient(urlWsdl, function(err, client) {
        if (err) return callback(err);
        
        client.validar(args, function(err, result) {
            if (err) return callback(err);
              console.log(result);
              if (Number(result['return']) === 1) {
                  return callback(null, { alias: username, displayName: username });
              }
              else {
                  return callback(null, undefined);
              }
        });
    });
};
