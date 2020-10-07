var express = require("express");
var app = express();
var router = express.Router();
var bodyparser = require('body-parser');
var oracledb = require('oracledb');
// Subir archivos al servidor 

const fileUpload = require('express-fileupload');
app.use(fileUpload({
    createParentPath: true
}))

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
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No hay archisvos'
            })
        } else {
            // Se rescatan los valores del json 
            var nombre = req.body.nombre;
            var descripcion = req.body.descripcion;
            var direccion = req.body.direccion;
            var valor = req.body.valor;
            var comuna = req.body.comuna;
            var cantidad = req.body.cantidad;
            const { picture } = req.files;
            var nombreImagen = picture.name;
            picture.mv("./imagenes" + picture.name)
            var acondicionado = req.body.acondicionados;
            // res.send({
            //     status:true,
            //     message:'Imagen subida'
            // })

            // Convertir String a INT
            var valorInt = parseInt(valor);
            var cantidadInt = parseInt(cantidad);
            var comunaInt = parseInt(comuna);


            async function insertarDepartamento() {

                let connection;

                try {
                    connection = await oracledb.getConnection({
                        user: "TEST3",
                        password: "real",
                        connectString: "localhost/orclpdb"
                    });
                    var bindvars = {
                        p_out: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 }
                    };
                    // Insertar en Tabla Departamento
                    const result = await connection.execute("BEGIN SP_CREAR_DEPARTAMENTO('" + descripcion + "',  '" + nombre + "', '" + direccion + "' , '" + valorInt + "' ,1,'" + cantidadInt + "','" + comunaInt + "' , :p_out); END;  ", bindvars);

                    var idInsertado = parseInt(result.outBinds.p_out);

                    var rutaImagen = "localhost/" + nombreImagen;
                    // Insertar en Tabla Imagen 
                    const resultadoImagen = await connection.execute("BEGIN SP_INSERT_IMAGE('" + idInsertado + "',  '" + rutaImagen + "'); END;", {}, {
                        outFormat: oracledb.OBJECT // Return the result as Object
                    });


                    // async function test() {
                    //     for (let i = 0; i < 6; i++) {
                    //         console.log('Before await for ', i);

                    //         // console.log('After await. Value is ', result);
                    //     }

                    // }
                    const fruitsToGet = ['apple', 'grape', 'pear'];
                    // async function insertar(fruit) {
                    //     await connection.execute("INSERT INTO t1(c1) VALUES('213');", {}, {
                    //         outFormat: oracledb.OBJECT // Return the result as Object
                    //     });
                    // }
                    const getNumFruit = fruit => {
                        return connection.execute("INSERT INTO t1(c1) VALUES('213');", {}, {
                            outFormat: oracledb.OBJECT // Return the result as Object
                        });
                      }
                    const forLoop = async _ => {
                        console.log('Start')
                      
                        for (let index = 0; index < fruitsToGet.length; index++) {
                          const fruit = fruitsToGet[index]
                          const numFruit = await getNumFruit(fruit)
                          console.log(numFruit)
                        }
                      
                        console.log('End')
                      }
                    forLoop();
                    // test().then(_ => console.log('After test() resolved'));

                    // console.log('After calling test');
                    // res.header('Access-Control-Allow-Origin', '*');
                    // res.header('Access-Control-Allow-Headers', 'Content-Type');
                    // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                    // res.contentType('application/json').status(200);
                    // res.send(JSON.stringify(1));
                    // printFiles();
                    // // Insertar en Acondicionados
                    // console.log("Acondicionados JSON" + JSON.stringify(req.body.acondicionados));

                    // // Tranformar a lista 
                    // var acondicionadosArray = JSON.parse("[" + req.body.acondicionados + "]");;

                    // const list = acondicionadosArray; //...an array filled with values



                    // processArray([2, 3, 5]);
                    // function delay() {
                    //     return new Promise();
                    //   }

                    //   async function delayedLog(item) {

                    //     await delay();
                    //     console.log(item);
                    //   }
                    //   async function processArray(array) {
                    //     array.forEach(async (item) => {
                    //         console.log("Elemento " +item);
                    //         // await connection.execute(sql);
                    //         // await sqls =  "BEGIN SP_INSERT_ACON(1,  '"+item+"'); END;";

                    //     })
                    //     console.log('Done!');
                    //   }




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
                }
            }

            insertarDepartamento();


        }
    } catch (error) {
        res.status(500).send(error);
    }
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
        connection.execute("SELECT  descripciond, nombred, direcciond, valordepartamento, cantidadh from departamento", {}, {
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
        connection.execute("select iddetatour, lugartour, imagentour from detalletour", {}, {
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
        connection.execute("select iddetatour, lugartour, imagentour , descripciontour, valortour,horariot  , c.nombrecomuna, r.nombreregion from detalletour td  join comuna c  on c.idcomuna = td.comuna_idcomuna join region r  on r.idregion = c.region_idregion where iddetatour = 1", {}, {
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


app.listen(3001, function () {
    console.log("Puerto 3001");
});