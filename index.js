var express = require("express");
var app = express();
var router = express.Router();
var bodyparser = require('body-parser');
var oracledb = require('oracledb');
// Subir archivos al servidor 

const fileUpload = require('express-fileupload');
app.use(fileUpload());
oracledb.autoCommit = true;
//Authoriser tous les requettes cors)
var cors = require('cors');
const { json } = require("body-parser");
app.use(cors());

app.use(bodyparser.json());

///Pour changer le format de la requete 
// app.use(bodyparser.urlencoded({
//     extended: true
// }));




// Traer las imagenes
var publicDir = require('path').join(__dirname, '/imagenes');
app.use(express.static(publicDir));

var connAttrs = {
    "user": "SATUR",
    "password": "bB2tV6fR1fG",
    "connectString": "(DESCRIPTION =(LOAD_BALANCE = ON)(FAILOVER = ON)(ADDRESS =(PROTOCOL = TCP)(HOST = satur.docn.us)(PORT = 1521))(ADDRESS = (PROTOCOL = TCP)(HOST = satur.docn.us )(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=str.docn.us)(FAILOVER_MODE=(TYPE=SELECT)(METHOD = BASIC))))"
}

// -------- VALIDAR AUTENTICACION USUARIOS --------------- //// 

app.post('/validarUsuario', function (req, res, next) {


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
            p_out_t: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 }
        };
        connection.execute("BEGIN SP_AUTENTIFICAR_USUARIOS('" + correo + "' ,'" + contrasena + "' ,:p_out , :p_out_t); END;", bindvars
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

});




///// --------------- TRAER USUARIOS ---------------------- ///
app.get('/usuarios', function (req, res) {
    "use strict";

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
});

// ACTUALIZAR USUARIOS
app.post('/updateUsuario', function (req, res, next) {


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

});

// ELIMINAR USUARIOS 

app.post('/eliminarUsuario', function (req, res, next) {



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

});

// AGREGAR USUARIO 

app.post('/agregarUsuario', function (req, res, next) {




    var run = req.body.run;
    var nombre = req.body.nombre;
    var apellido = req.body.apellido;
    var correo = req.body.correo;
    var telefono = req.body.telefono;
    var tipoUsuario = req.body.tipousuario;

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

        connection.execute("BEGIN SP_CREAR_USUARIOS('" + nombre + "', '" + apellido + "' , 'contrasena' ,'" + correo + "', '" + telefono + "' , " + tipoUsuario + " ,'" + run + "'); END;", {}, {
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

});


// AGREGAR ACONDICIONADO AL DEPARTAMENTO 

// Listar Acondicionados

app.get('/getAcondicionados', function (req, res) {
    "use strict";

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
        connection.execute("SELECT IDACOND,NOMBREACONDI,VALORACOND FROM ACONDICIONADO ", {}, {
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
});


// Funcion para Traer los departamentos 


// Funcion para Agregar Departamentos 
app.post('/agregarDepartamentos', function (req, res, next) {
    "use strict";
    console.log("SE HIZO POST" + JSON.stringify(req.file));
    try {
        if (!req.file) {
            console.log("NO HAY");
            res.send({
                status: false,
                message: 'No hay archisvos'
            })
        } else {
            console.log("ACÁ");
            // Se rescatan los valores del json 
            // var nombre = req.body.nombre;
            // var descripcion = req.body.descripcion;
            // var direccion = req.body.direccion;
            // var valor = req.body.valor;
            // var comuna = req.body.comuna;
            // var cantidad = req.body.cantidad;
            // const { picture } = req.files;
            // var nombreImagen = picture.name;
            // picture.mv("./issss" + picture.name)
            // var acondicionado = req.body.acondicionados;
            // res.send({
            //     status:true,
            //     message:'Imagen subida'
            // })

            // // Convertir String a INT
            // var valorInt = parseInt(valor);
            // var cantidadInt = parseInt(cantidad);
            // var comunaInt = parseInt(comuna);




            // async function insertarDepartamento() {

            //     let connection;

            //     try {
            //         connection = await oracledb.getConnection({
            //             user: "SATUR",
            //             password: "bB2tV6fR1fG",
            //             connectString: "satur.docn.us/str.docn.us"
            //         });
            //         var bindvars = {
            //             p_out: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 }
            //         };
            //         // Insertar en Tabla Departamento
            //         const result = await connection.execute("BEGIN SP_CREAR_DEPARTAMENTO('" + descripcion + "',  '" + nombre + "', '" + direccion + "' , '" + valorInt + "' ,1,'" + cantidadInt + "','" + comunaInt + "' , :p_out); END;  ", bindvars);

            //         var idInsertado = parseInt(result.outBinds.p_out);
            //         console.log("Ultima id" + idInsertado);
            //         var rutaImagen = "localhost/" + nombreImagen;
            //         // Insertar en Tabla Imagen 
            //         const resultadoImagen = await connection.execute("BEGIN SP_INSERT_IMAGE('" + idInsertado + "',  '" + rutaImagen + "'); END;", {}, {
            //             outFormat: oracledb.OBJECT // Return the result as Object
            //         });





            //     } catch (err) {
            //         console.error(err);

            //         // Error al insertar alguna query de arriba
            //     } finally {

            //         if (connection) {
            //             try {
            //                 await connection.close();
            //             } catch (err) {
            //                 console.error(err);
            //             }
            //         }
            //         return idInsertado;
            //     }

            // }

            // (async function () {
            //     const idInsertado = await insertarDepartamento();
            //     async function insertarAcondicionados(acondicionado, idInsertado) {
            //         let connection;
            //         console.log("Entro a la funcion" + idInsertado);
            //         var itemNumericos = acondicionado;
            //         var arrayItemsN = [];
            //         arrayItemsN = itemNumericos.split(",");

            //         const arr = [];
            //         var acond = arrayItemsN;
            //         var label = idInsertado;

            //         for (var i = 0; i < acond.length; i++) {
            //             var obj = {};
            //             obj['id'] = label;
            //             obj['acond'] = parseInt(acond[i]);

            //             arr.push(obj);
            //         }




            //         try {
            //             connection = await oracledb.getConnection({
            //                 user: "SATUR",
            //                 password: "bB2tV6fR1fG",
            //                 connectString: "satur.docn.us/str.docn.us"
            //             });

            //             const sql = `INSERT INTO DEPART_ACOND 
            //                            (DEPARTAMENTO_IDDEPARTAMENTO , ACONDICIONADO_IDACOND) 
            //                            VALUES 
            //                            (:id, :acond )`;


            //             const options = {
            //                 // autoCommit: true,
            //                 bindDefs: {
            //                     id: { type: oracledb.NUMBER },
            //                     acond: { type: oracledb.NUMBER },
            //                 }
            //             };
            //             console.log("Acá");
            //             let result = await connection.executeMany(sql, arr, options);
            //             res.header('Access-Control-Allow-Origin', '*');
            //             res.header('Access-Control-Allow-Headers', 'Content-Type');
            //             res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            //             res.contentType('application/json').status(200);
            //             res.send(JSON.stringify(1));
            //         } catch (err) {
            //             console.error(err);
            //         } finally {
            //             if (connection) {
            //                 try {
            //                     await connection.close();
            //                 } catch (err) {
            //                     console.error(err);
            //                 }
            //             }
            //         }
            //     }

            //     insertarAcondicionados(acondicionado, idInsertado);
            // })();
            // console.log("ID ULTIMO" +);


        }
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/upload', function (req, res) {
    console.log(req.files.foto[0].name);


    // Se rescatan los valores del json 
    var nombre = req.body.nombre;
    var descripcion = req.body.descripcion;
    var direccion = req.body.direccion;
    var valor = req.body.valor;
    var comuna = req.body.comuna;
    var cantidad = req.body.cantidad;

    var acondicionado = req.body.acondicionados;

    // Convertir String a INT
    var valorInt = parseInt(valor);
    var cantidadInt = parseInt(cantidad);
    var comunaInt = parseInt(comuna);




    async function insertarDepartamento() {

        let connection;

        try {
            connection = await oracledb.getConnection({
                user: "SATUR",
                password: "bB2tV6fR1fG",
                connectString: "satur.docn.us/str.docn.us"
            });
            var bindvars = {
                p_out: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 }
            };
            // Insertar en Tabla Departamento
            const result = await connection.execute("BEGIN SP_CREAR_DEPARTAMENTO('" + descripcion + "',  '" + nombre + "', '" + direccion + "' , '" + valorInt + "' ,1,'" + cantidadInt + "','" + comunaInt + "' , :p_out); END;  ", bindvars);

            var idInsertado = parseInt(result.outBinds.p_out);
            console.log("Ultima id" + idInsertado);






        } catch (err) {
            console.error(err);

            // Error al insertar alguna query de arriba
        } finally {

            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error(err);
                }
            }
            return idInsertado;
        }

    }



    (async function () {
        const idInsertado = await insertarDepartamento();
        async function insertarAcondicionados(acondicionado, idInsertado) {
            let connection;
            console.log("Entro a la funcion" + idInsertado);
            var itemNumericos = acondicionado;
            var arrayItemsN = [];
            arrayItemsN = itemNumericos.split(",");

            const arr = [];
            var acond = arrayItemsN;
            var label = idInsertado;

            for (var i = 0; i < acond.length; i++) {
                var obj = {};
                obj['id'] = label;
                obj['acond'] = parseInt(acond[i]);

                arr.push(obj);
            }




            try {
                connection = await oracledb.getConnection({
                    user: "SATUR",
                    password: "bB2tV6fR1fG",
                    connectString: "satur.docn.us/str.docn.us"
                });

                const sql = `INSERT INTO DEPART_ACOND 
                               (DEPARTAMENTO_IDDEPARTAMENTO , ACONDICIONADO_IDACOND) 
                               VALUES 
                               (:id, :acond )`;


                const options = {
                    // autoCommit: true,
                    bindDefs: {
                        id: { type: oracledb.NUMBER },
                        acond: { type: oracledb.NUMBER },
                    }
                };
                console.log("INSERTANDO LAS LOS ACONDICIONADOS");
                let result = await connection.executeMany(sql, arr, options);


                var files = req.files.foto;
                var imagenArray = [];
                for (var i = 0; i < files.length; i++) {
                    console.log(files[i]);
                    req.files.foto[i].mv("./imagen" + req.files.foto[i].name)

                    var obj = {};

                    obj['nombreIm'] = req.files.foto[i].name;
                    obj['idD'] = idInsertado;


                    imagenArray.push(obj);


                }


                const sqlImagen = `BEGIN
                SP_INSERT_IMAGE(:idD,:nombreIm);
             END;`;

                const optionImagen = {
                    // autoCommit: true,
                    bindDefs: {

                        idD: { type: oracledb.NUMBER },
                        nombreIm: { type: oracledb.STRING, maxSize: 200 },

                    }
                };
                console.log("INSERTANDO LAS IMAGENES");
                let resultadoImaegn = await connection.executeMany(sqlImagen, imagenArray, optionImagen);
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', 'Content-Type');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                res.contentType('application/json').status(200);
                res.send(JSON.stringify(1));
            } catch (err) {
                console.error(err);
            } finally {
                if (connection) {
                    try {
                        await connection.close();
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        }

        insertarAcondicionados(acondicionado, idInsertado);




    })();



});
app.get('/getDepartamentos', function (req, res) {
    "use strict";

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
        connection.execute("SELECT iddepartamento, descripciond, nombred, direcciond, valordepartamento, cantidadh , (CASE WHEN activo = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END) AS activo from departamento", {}, {
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
});

// Eliminar Departamento
app.post('/eliminarDepartamento', function (req, res, next) {



    var id = req.body.IDDEPARTAMENTO;
    var idInt = parseInt(id);
    console.log("ID " + idInt);
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

        connection.execute("BEGIN SP_ESTADO_DEPARTAMENTO(" + idInt + " , 1 ); END;", {}, {
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

});


// Traer las regiones y comunas

app.get('/getRegiones', function (req, res) {
    "use strict";

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
        connection.execute("SELECT idregion , nombreregion from region", {}, {
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
});

app.get('/getComuna/:id', function (req, res) {
    "use strict";
    var regionId = req.params.id;
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
        connection.execute("select idcomuna , nombrecomuna, region_idregion from comuna where region_idregion = '" + regionId + "'  ", {}, {
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
});



// TRAER LOS TOURS 
app.get('/getTours', function (req, res) {
    "use strict";

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
        connection.execute("select dt.iddetatour, dt.lugartour,  dt.valortour , dt.descripciontour, c.nombrecomuna , r.nombreregion , dt.horariot from detalletour dt join comuna c  on c.idcomuna = dt.comuna_idcomuna join region r on r.idregion = c.region_idregion", {}, {
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
});
app.get('/detalleTour/:idtour', function (req, res) {
    "use strict";
    var regionId = req.params.idtour;

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
        connection.execute("select iddetatour, lugartour, imagentour , descripciontour, valortour,horariot  , c.nombrecomuna, r.nombreregion from detalletour td  join comuna c  on c.idcomuna = td.comuna_idcomuna join region r  on r.idregion = c.region_idregion where iddetatour =" + regionId + "  ", {}, {
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
});


// Subir las Imagenes del tour 


app.post('/uploadImagen', function (req, res) {
    console.log(req.files);

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.contentType('application/json').status(200);
    res.send(JSON.stringify(1));
    req.files.file.mv("./imagen" + req.files.file.name)

});

app.post('/agregarTour', function (req, res) {
    // console.log(req.files);

    // res.header('Access-Control-Allow-Origin', '*');
    // res.header('Access-Control-Allow-Headers', 'Content-Type');
    // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    // res.contentType('application/json').status(200);
    // res.send(JSON.stringify(1));
    console.log(req.files.file.length);
    var files = req.files.file;
   
    var lugar = req.body.lugar;
    var descripcion = req.body.descripcion;
    var valor = req.body.valor;
    var comuna = req.body.comuna;
    var fecha = req.body.fecha;

    var comunaInt = parseInt(comuna);
    var valorInt = parseInt(valor);

    async function insertarDetalleTour() {

        let connection;

        try {
            connection = await oracledb.getConnection({
                user: "SATUR",
                password: "bB2tV6fR1fG",
                connectString: "satur.docn.us/str.docn.us"
            });
            var bindvars = {
                p_out: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 }
            };
            // Insertar en Tabla Departamento
            const result = await connection.execute("BEGIN SP_CREAR_DETALLE_TOUR('" + lugar + "', '" + descripcion + "' , '" + valorInt + "', '" + comunaInt + "' ,TO_DATE('" + fecha + "', 'yyyy-mm-dd hh24:mi:ss') , :p_out); END;", bindvars);

            var idInsertado = parseInt(result.outBinds.p_out);
            console.log("Ultima id" + idInsertado);






        } catch (err) {
            console.error(err);

            // Error al insertar alguna query de arriba
        } finally {

            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error(err);
                }
            }
            return idInsertado;
        }

    }

    (async function () {
        const idInsertado = await insertarDetalleTour();
        async function insertarImagenTour(idInsertado) {


            // Mover las Imagenes 
            var imagenArray = [];
            for (var i = 0; i < files.length; i++) {
                console.log("TEST");
                req.files.file[i].mv("tour-" + req.files.file[i].name)

                var obj = {};

                obj['imagen'] = req.files.file[i].name;
                obj['id'] = idInsertado;


                imagenArray.push(obj);


            }


            let connection;
            console.log("Entro a la funcion" + idInsertado);
   


            try {
                connection = await oracledb.getConnection({
                    user: "SATUR",
                    password: "bB2tV6fR1fG",
                    connectString: "satur.docn.us/str.docn.us"
                });



                const sql = `BEGIN
                SP_INSERTAR_IMAGEN_TOUR(:imagen,:id);
             END;`;


                const options = {
                    // autoCommit: true,
                    bindDefs: {
                        imagen: { type: oracledb.STRING, maxSize: 200 },
                        id: { type: oracledb.NUMBER },
                    }
                };
                console.log("INSERTANDO LAS IMAGENES" + JSON.stringify(imagenArray));
                
                let result = await connection.executeMany(sql, imagenArray, options);



                console.log("IMAGENES INSERTADAS");

                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', 'Content-Type');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                res.contentType('application/json').status(200);
                res.send(JSON.stringify(1));
            } catch (err) {
                console.error(err);
            } finally {
                if (connection) {
                    try {
                        await connection.close();
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        }

        insertarImagenTour(idInsertado);




    })();



});


app.listen(3001, 'localhost', function () {
    console.log("Puerto 3001");
});

