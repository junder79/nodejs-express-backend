class UsuarioController {
    static autenticacionUsuario(req, res) {
        var correo = req.body.correo;
        var contrasena = req.body.contrasena;

        oracledb.getConnection(connAttrs, function (err, connection) {
            if (err) {
                // Error al conectar
                res.set('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error al conectar a la base de datos",
                    detailed_message: err.message
                }));
                return;
            }
            var bindvars = {
                p_out: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 },
                p_out_t: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 },
                p_out_id: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 },
                p_out_nombre: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 },
                p_out_apellido: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 },
                p_out_contrasena: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 },
                p_out_telefono: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 },
                p_out_rut: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 },
                p_out_email: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 },
            };
            connection.execute("BEGIN SP_AUTENTIFICAR_CLIENTES('" + correo + "' ,'" + contrasena + "' ,:p_out , :p_out_t , :p_out_id ,:p_out_nombre ,:p_out_apellido , :p_out_contrasena ,  :p_out_telefono ,:p_out_rut , :p_out_email); END;", bindvars
                , function (err, result) {
                    if (err) {
                        res.header('Access-Control-Allow-Origin', '*');
                        res.header('Access-Control-Allow-Headers', 'Content-Type');
                        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                        res.contentType('application/json').status(200);
                        res.send(JSON.stringify(err.message));

                    } else {
                        res.header('Access-Control-Allow-Origin', '*');
                        res.header('Access-Control-Allow-Headers', 'Content-Type');
                        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                        res.contentType('application/json').status(200);
                        res.send(JSON.stringify(result.outBinds));
                        console.log(JSON.stringify(result.outBinds));

                    }
                    // Release the connection
                    connection.release(
                        function (err) {
                            if (err) {
                                console.error(err.message);
                            } else {
                                console.log("POST /sendTablespace : Connection released");
                            }
                        });
                });
        });

    }

    static getUsuarios(req, res) {
        oracledb.getConnection(connAttrs, function (err, connection) {
            if (err) {
                // Error al conectar
                res.set('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error al conectar a la base de datos",
                    detailed_message: err.message
                }));
                return;
            }
            connection.execute("SELECT * FROM usuarios", {}, {
                outFormat: oracledb.OBJECT // Return the result as Object
            }, function (err, result) {
                if (err) {
                    res.set('Content-Type', 'application/json');
                    res.status(500).send(JSON.stringify({
                        status: 500,
                        message: "Error getting the dba_tablespaces",
                        detailed_message: err.message
                    }));
                } else {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Headers', 'Content-Type');
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                    res.contentType('application/json').status(200);
                    res.send(JSON.stringify(result.rows));
                    // console.log(JSON.stringify(result));
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("GET /sendTablespace : Connection released");
                        }
                    });
            });
        });
    }

    static getUsuarioEspecifico(req, res) {
        var usuariosId = 1;

        oracledb.getConnection(connAttrs, function (err, connection) {
            if (err) {
                // Error al conectar
                res.set('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error al conectar a la base de datos",
                    detailed_message: err.message
                }));
                return;
            }
            connection.execute("SELECT idusuario, nombreusuario, apellidousuario, contrasenausuario, correousuario, telefonousuario , rutusuario from usuarios  where idusuario = " + usuariosId + " ", {}, {
                outFormat: oracledb.OBJECT // Return the result as Object
            }, function (err, result) {
                if (err) {
                    res.set('Content-Type', 'application/json');
                    res.status(500).send(JSON.stringify({
                        status: 500,
                        message: "Error getting the dba_tablespaces",
                        detailed_message: err.message
                    }));
                } else {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Headers', 'Content-Type');
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                    res.contentType('application/json').status(200);
                    res.send(JSON.stringify(result.rows));

                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("GET /sendTablespace : Connection released");
                        }
                    });
            });
        });
    }

    static usuarioUpdate(req, res) {
        var motdepasse = req.body.motdepasse;
        var DefaultTBS = req.body.DefaultTBS;
        var id = req.body.IDUSUARIO;
        var nombre = req.body.NOMBREUSUARIO;
        var apellido = req.body.APELLIDOUSUARIO;
        var correo = req.body.CORREOUSUARIO;
        var telefono = req.body.TELEFONOUSUARIO;

        oracledb.getConnection(connAttrs, function (err, connection) {
            if (err) {
                // Error al conectar
                res.set('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error al conectar a la base de datos",
                    detailed_message: err.message
                }));
                return;
            }

            connection.execute("BEGIN SP_MODIFICAR_USUARIO(" + id + ", '" + nombre + "','" + apellido + "','" + correo + "','" + telefono + "'); END;", {}, {
                outFormat: oracledb.OBJECT // Return the result as Object
            }, function (err, result) {
                if (err) {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Headers', 'Content-Type');
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                    res.contentType('application/json').status(200);
                    res.send(JSON.stringify(err.message + " " + motdepasse));

                } else {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Headers', 'Content-Type');
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                    res.contentType('application/json').status(200);
                    res.send(JSON.stringify("1"));


                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("POST /sendTablespace : Connection released");
                        }
                    });
            });
        });

    }

    static usuarioDelete (req, res) 
    {
        
    var id = req.body.IDUSUARIO;


    oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error al conectar
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                message: "Error al conectar a la base de datos",
                detailed_message: err.message
            }));
            return;
        }

        connection.execute("BEGIN SP_ELIMINAR_USUARIO(" + id + "); END;", {}, {
            outFormat: oracledb.OBJECT // Return the result as Object
        }, function (err, result) {
            if (err) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', 'Content-Type');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                res.contentType('application/json').status(200);
                res.send(JSON.stringify(err.message));

            } else {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', 'Content-Type');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                res.contentType('application/json').status(200);
                res.send(JSON.stringify(1));


            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("POST /sendTablespace : Connection released");
                    }
                });
        });
    });
    }

    static agregarCliente (req ,res)
    {
        var run = req.body.rut;
        var nombre = req.body.nombre;
        var apellido = req.body.apellido;
        var correo = req.body.email;
        var telefono = req.body.telefono;
        var contrasena = req.body.contrasena;
    
        oracledb.getConnection(connAttrs, function (err, connection) {
            if (err) {
                // Error al conectar
                res.set('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error al conectar a la base de datos",
                    detailed_message: err.message
                }));
                return;
            }
    
            connection.execute("BEGIN SP_CREAR_USUARIOS('" + nombre + "', '" + apellido + "' , '" + contrasena + "' ,'" + correo + "', '" + telefono + "' , 3 ,'" + run + "'); END;", {}, {
                outFormat: oracledb.OBJECT // Return the result as Object
            }, function (err, result) {
                if (err) {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Headers', 'Content-Type');
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                    res.contentType('application/json').status(200);
                    res.send(JSON.stringify(err.message));
    
                } else {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Headers', 'Content-Type');
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                    res.contentType('application/json').status(200);
                    res.send(JSON.stringify(1));
    
    
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("POST /sendTablespace : Connection released");
                        }
                    });
            });
        });
    }
    static updateCliente (req, res) 
    {


        var nombre = req.body.nombre;
        var apellido = req.body.apellido;
        var correo = req.body.email;
        var telefono = req.body.telefono;
        var contrasena = req.body.contrasena;
        var idUsuario = req.body.id;
        console.log("DATOS" + JSON.stringify(req.body));
        var tipo = 1;
        oracledb.getConnection(connAttrs, function (err, connection) {
            if (err) {
                // Error al conectar
                res.set('Content-Type', 'application/json');
                res.status(500).send(JSON.stringify({
                    status: 500,
                    message: "Error al conectar a la base de datos",
                    detailed_message: err.message
                }));
                return;
            }
    
            connection.execute("BEGIN SP_MODIFICAR_USUARIO('" + idUsuario + "', '" + nombre + "' , '" + apellido + "' , '" + contrasena + "','" + correo + "', '" + telefono + "' , 1); END;", {}, {
                outFormat: oracledb.OBJECT // Return the result as Object
            }, function (err, result) {
                if (err) {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Headers', 'Content-Type');
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                    res.contentType('application/json').status(200);
                    res.send(JSON.stringify(err.message));
    
                } else {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Headers', 'Content-Type');
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                    res.contentType('application/json').status(200);
                    res.send(JSON.stringify(1));
    
    
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log("POST /sendTablespace : Connection released");
                        }
                    });
            });
        });
    }
}

module.exports = UsuarioController;