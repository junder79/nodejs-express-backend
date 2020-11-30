var express = require("express");
var app = express();
var router = express.Router();
var bodyparser = require('body-parser');
var oracledb = require('oracledb');

// Controladores
const WebpayPlusController = require('./controllers/WebpayNormalController')
const UsuarioController = require('./controllers/UsuarioController.js');
const ReservaController = require('./controllers/ReservaController');
// Subir archivos al servidor 
const fileUpload = require('express-fileupload');
app.use(fileUpload());
oracledb.autoCommit = true;
//Authoriser tous les requettes cors)
var cors = require('cors');
const { json } = require("body-parser");
app.use(cors());

app.use(bodyparser.urlencoded({ extended: true }))

///Pour changer le format de la requete 
// app.use(bodyparser.urlencoded({
//     extended: true
// }));

// Peticiones transabank 
const transactions = {}
app.post("/webpay-normal/init", WebpayPlusController.init)
app.post("/webpay-normal/response", WebpayPlusController.response)
app.post("/webpay-normal/finish", WebpayPlusController.finish)

app.set("view engine", "ejs")
// Traer las imagenes
app.use(express.static(__dirname + '/'));
var connAttrs = {
    "user": "SATUR",
    "password": "bB2tV6fR1fG",
    "connectString": "(DESCRIPTION =(LOAD_BALANCE = ON)(FAILOVER = ON)(ADDRESS =(PROTOCOL = TCP)(HOST = satur.docn.us)(PORT = 1521))(ADDRESS = (PROTOCOL = TCP)(HOST = satur.docn.us )(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=str.docn.us)(FAILOVER_MODE=(TYPE=SELECT)(METHOD = BASIC))))"
}

// -------- VALIDAR AUTENTICACION USUARIOS --------------- //// 

app.post('/api/validarUsuario',UsuarioController.autenticacionUsuario);
///// --------------- TRAER USUARIOS ---------------------- ///
app.get('/api/usuarios', UsuarioController.getUsuarios);
app.get('/api/getCliente', UsuarioController.getUsuarioEspecifico);
app.post('/api/updateUsuario',UsuarioController.usuarioUpdate);
app.post('/api/eliminarUsuario',UsuarioController.usuarioDelete);

// AGREGAR Cliente 

app.post('/api/agregarCliente', UsuarioController.agregarCliente);
app.post('/api/modificarCliente', UsuarioController.updateCliente);



// Listar Acondicionados

app.get('/api/getAcondicionados', function (req, res) {
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

app.get('/api/getAcondicionados/:iddepartamento', function (req, res) {
    "use strict";
    var idDepartamento = req.params.iddepartamento;
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
        connection.execute("SELECT  A.NOMBREACONDI FROM DEPART_ACOND DA join ACONDICIONADO A ON A.IDACOND  = DA.ACONDICIONADO_IDACOND WHERE DA.DEPARTAMENTO_IDDEPARTAMENTO = " + idDepartamento + "", {}, {
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




app.post('/api/upload', function (req, res) {
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
            const result = await connection.execute("BEGIN SP_CREAR_DEPARTAMENTO('" + descripcion + "',  '" + nombre + "', '" + direccion + "' , '" + valorInt + "' ,1,'" + cantidadInt + "','" + comunaInt + "' ,1 , :p_out); END;  ", bindvars);

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

                const sql = `BEGIN SP_ASIGNAR_ACONDICIONADO
                               (:id, :acond ); END;`;


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
                    req.files.foto[i].mv("http://localhost:3001/depart-" + idInsertado + req.files.foto[i].name.slice(-4))

                    var obj = {};

                    obj['nombreIm'] = "http://localhost:3001/depart-" + idInsertado + req.files.foto[i].name.slice(-4);
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
                        nombreIm: { type: oracledb.STRING, maxSize: 600 },

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
app.get('/api/getDepartamentos', function (req, res) {
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
app.post('/api/eliminarDepartamento', function (req, res, next) {



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

app.get('/api/getImagesDepartament/:iddepartamento', function (req, res) {
    "use strict";
    var idDepartamento = req.params.iddepartamento;
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
        connection.execute("SELECT IDIMAGEN , RUTAIMAGEN , DEPARTAMENTO_IDDEPARTAMENTO FROM IMAGENDEPA WHERE  DEPARTAMENTO_IDDEPARTAMENTO = " + idDepartamento + "", {}, {
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

// Traer las regiones y comunas

app.get('/api/getRegiones', function (req, res) {
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

app.get('/api/getComuna/:id', function (req, res) {
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
app.get('/api/getTours/:id', function (req, res) {
    "use strict";
    var idComuna = req.params.id;
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
        connection.execute("select dt.iddetatour, dt.lugartour,dt.descripciontour,dt.valortour,dt.comuna_idcomuna,dt.horariot, it.imagen from detalletour dt JOIN imagentour it on it.detalletour_iddetatour = dt.iddetatour  where dt.comuna_idcomuna = " + idComuna + "  GROUP BY dt.iddetatour , dt.lugartour,dt.descripciontour,dt.valortour,dt.comuna_idcomuna,dt.horariot, it.imagen", {}, {
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


app.get('/api/detalleTourImagen/:idtour', function (req, res) {
    "use strict";
    var tourId = req.params.idtour;

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
        connection.execute("SELECT idimagen,imagen,detalletour_iddetatour from imagentour  where detalletour_iddetatour =" + tourId + "  ", {}, {
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
app.get('/api/detalleTour/:idtour', function (req, res) {
    "use strict";
    var tourId = req.params.idtour;

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
        connection.execute("select dt.iddetatour, dt.lugartour,dt.descripciontour,dt.valortour,dt.comuna_idcomuna,to_char(dt.horariot,'HH:MI:SSAM') as horariot, r.nombreregion , c.nombrecomuna from detalletour dt JOIN COMUNA c on c.idcomuna = dt.comuna_idcomuna JOIN REGION r on r.idregion = c.region_idregion  where dt.iddetatour = " + tourId + " ", {}, {
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
app.get('/api/getTransporte/:id', function (req, res) {
    "use strict";
    var idComuna = req.params.id;
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
        connection.execute("SELECT ve.idvehiculo, ve.nombrec, ve.apellidoc, ve.patente, ve.modelo, ve.marca, ve.tipovehiculo_idtipov , ve.comuna_idcomuna, vi.direccion, vi.valor, vi.id from vehiculo ve  join viajes vi on vi.vehiculo_idvehiculo = ve.idvehiculo where  ve.comuna_idcomuna = " + idComuna + " ", {}, {
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
app.get('/api/departamentoimagen/:idDepartamento', function (req, res) {
    "use strict";
    var departamentoId = req.params.idDepartamento;

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
        connection.execute("select idimagen , rutaimagen, departamento_iddepartamento from imagendepa  where DEPARTAMENTO_IDDEPARTAMENTO =" + departamentoId + "  ", {}, {
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

app.get('/api/getInfodepartamento/:idDepartamento', function (req, res) {
    "use strict";
    var departamentoId = req.params.idDepartamento;

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
        connection.execute("SELECT * FROM DEPARTAMENTO WHERE IDDEPARTAMENTO =" + departamentoId + "  ", {}, {
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


app.get('/api/getInfoacondicionado/:idDepartamento', function (req, res) {
    "use strict";
    var departamentoId = req.params.idDepartamento;

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
        connection.execute("  SELECT DA.IDDEPARTACO , DA.DEPARTAMENTO_IDDEPARTAMENTO, DA.ACONDICIONADO_IDACOND , A.NOMBREACONDI FROM DEPART_ACOND DA JOIN ACONDICIONADO A  ON A.IDACOND  = DA.ACONDICIONADO_IDACOND WHERE DA.DEPARTAMENTO_IDDEPARTAMENTO =" + departamentoId + " ", {}, {
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

app.get('/api/getReservas/:idUsuario', function (req, res) {
    "use strict";
    var idUsuario = req.params.idUsuario;

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
        connection.execute("SELECT r.idreserva , TO_CHAR( r.fechainicioreserva, 'yyyy/mm/dd') as fechainicioreserva , TO_CHAR( r.fechaterminoreserva , 'yyyy/mm/dd') as fechaterminoreserva  , r.montototalreserva , r.usuarios_idusuario,r.departamento_iddepartamento, r.estador_idestado , er.estadoreserva , id.rutaimagen ,d.descripciond,d.nombred  from reservas r  join estadoreserva er on er.idestado = r.estador_idestado join imagendepa id on id.departamento_iddepartamento = r.departamento_iddepartamento join departamento d  on d.iddepartamento = r.departamento_iddepartamento where usuarios_idusuario = " + idUsuario + " group by r.idreserva , r.fechainicioreserva, r.fechaterminoreserva, r.montototalreserva, r.usuarios_idusuario,r.departamento_iddepartamento, r.estador_idestado , er.estadoreserva,id.rutaimagen,d.descripciond ,d.nombred   ", {}, {
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
app.get('/api/reservaespecifica/:idreserva', function (req, res) {
    "use strict";
    var idReserva = req.params.idreserva;

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
        connection.execute("SELECT r.idreserva , TO_CHAR( r.fechainicioreserva, 'yyyy/mm/dd') as fechainicioreserva , TO_CHAR( r.fechaterminoreserva , 'yyyy/mm/dd') as fechaterminoreserva , r.valoranticipado , r.montototalreserva ,r.departamento_iddepartamento, r.estador_idestado , er.estadoreserva ,d.descripciond,d.nombred  from reservas r   join estadoreserva er   on er.idestado = r.estador_idestado    join departamento d    on d.iddepartamento = r.departamento_iddepartamento   where r.idreserva  =" + idReserva + " ", {}, {
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
app.get('/api/tourreserva/:idreserva', function (req, res) {
    "use strict";
    var idReserva = req.params.idreserva;

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
        connection.execute("select t.idtour , t.reservas_idreserva,dt.lugartour, dt.valortour , dt.horariot  from tour t  join detalletour dt     on dt.iddetatour = t.detalletour_iddetatour   where t.reservas_idreserva =" + idReserva + "  ", {}, {
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
                var cantidadFilas = JSON.stringify(result.rows.length);
                console.log("cantidad filas" + JSON.stringify(result.rows.length))
                if (cantidadFilas > 0) {
                    res.send(JSON.stringify(result.rows));
                } else {
                    res.send(JSON.stringify(0));
                    console.log("Hay 0 filas");
                }


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
app.get('/api/transportereserva/:idreserva', function (req, res) {
    "use strict";
    var idReserva = req.params.idreserva;

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
        connection.execute("select t.idtransporte, t.horario, t.fechaservicio , v.direccion , v.valor ,t.reservas_idreserva from transporte t  join viajes v   on v.id = t.viajes_id  join vehiculo ve  on ve.idvehiculo = v.vehiculo_idvehiculo  where t.reservas_idreserva= " + idReserva + " ", {}, {

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





app.post('/api/uploadImagen', function (req, res) {
    console.log(req.files);

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.contentType('application/json').status(200);
    res.send(JSON.stringify(1));
    req.files.file.mv("./imagen" + req.files.file.name)

});

app.post('/api/pagar', function (req, res) {


    const Transbank = require('transbank-sdk');

    const transaction = new Transbank.Webpay(
        Transbank.Configuration.forTestingWebpayPlusNormal()
    ).getNormalTransaction();

    let Webpay = new Transbank.Webpay(
        Transbank.Configuration.forTestingWebpayPlusNormal()
    ).getNormalTransaction();
    let url = "http://" + req.get("host")
    let amount = req.body.total;
    Webpay.initTransaction(
        amount,
        "Orden" + Math.round(Math.random() * 999999999),
        req.sessionId,
        url + "/webpay-normal/response",
        url + "/webpay-normal/finish").then((data) => {
            transactions[data.token] = { amount: amount }
            res.render("redirect-transbank",
                { url: data.url, token: data.token, inputName: "TBK_TOKEN" , idReserva:1})
        })

});


app.post('/api/agregarTour', function (req, res) {


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

                obj['imagen'] = "http://localhost:3001/" + "tour-" + req.files.file[i].name;
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


// Crear Reserva 

app.post('/api/crearreserva', function (req,res){
    
    var fechaInicio = req.body.fecha_inicio;
    var fechaTermino = req.body.fecha_termino;
    var montoTotal = req.body.monto_total;
    var valorAnticipado = req.body.valor_anticipado;
    var idUsuario = req.body.id_usuario;
    var departamento = 1;
    var fechaActual = req.body.fecha_actual;
    var tourId = req.body.tourId;
    var estadoTour = req.body.estadoTour;
    var estadoTransporte = req.body.estadoTransporte;
    var transporteId = req.body.transporteId;
    var fechaTransporte = req.body.fechaTransporte;
    var horaTransporte = req.body.horaTransporte;

    // Convertir String a INT
    var montoTotalInt = parseInt(montoTotal);
    var valorAnticipadoInt = parseInt(valorAnticipado);




    async function insertarReserva() {

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
            // Insertar en Tabla Reserva
            const result = await connection.execute("BEGIN SP_CREAR_RESERVA(TO_DATE('" + fechaInicio + "', 'yyyy/mm/dd') ,TO_DATE('" + fechaTermino + "' , 'yyyy/mm/dd')  , '" + montoTotalInt + "' ,'" + valorAnticipadoInt + "', '" + idUsuario + "' , TO_DATE('" + fechaActual + "', 'yyyy/mm/dd')  ,'" + departamento + "' ,1,:p_out); END;", bindvars);
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



    (async () => {
        const idReserva = await insertarReserva();
        console.log("Se Insertar a las demas tablas de reservas");
        try {
            connection = await oracledb.getConnection({
                user: "SATUR",
                password: "bB2tV6fR1fG",
                connectString: "satur.docn.us/str.docn.us"
            });

            // Insertar en Tabla Disponiblidad 
            const result = await connection.execute("BEGIN SP_INSERT_DISP_DEPART(TO_DATE('" + fechaInicio + "', 'yyyy/mm/dd'),TO_DATE('" + fechaTermino + "', 'yyyy/mm/dd'),'" + departamento + "'); END;");

            if (estadoTour == 1) {
                // Insertar el Tour
                const resultadoTour = await connection.execute("BEGIN SP_ASIGNAR_TOUR(to_date(sysdate,'yyyy/mm/dd hh24:mi:ss'),'" + tourId + "','" + idReserva + "'); END;");
            }
            if (estadoTransporte == 1) {
                // Insertar el Transporte
                const resultadoTransporte = await connection.execute("BEGIN SP_CREAR_TRANSPORTE(to_date('15:00:00','HH24:MI:SS'),TO_DATE('" + fechaTransporte + "', 'yyyy/mm/dd') ,to_date(sysdate,'yyyy/mm/dd hh24:mi:ss') ,'" + transporteId + "','" + idReserva + "'); END;");

            }


            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.contentType('application/json').status(200);
            res.send(JSON.stringify({respuestaReserva:1 ,lastId:idReserva }));





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
    })();
})

// Peticion de Pago restante
app.post('/api/pagorestante', function (req, res, next) {



    var id = req.body.idReserva;
    async function insertarPagoRestante(id) {

        let connection;

        try {
            connection = await oracledb.getConnection({
                user: "SATUR",
                password: "bB2tV6fR1fG",
                connectString: "satur.docn.us/str.docn.us"
            });

            // Insertar en Pago Restante
            const result = await connection.execute("BEGIN sp_agregar_pago('UUA87ANHAJYS' ,(TO_DATE(sysdate, 'dd/mm/yyyy hh24:mi:ss')),1," + id + ",1,'Check In'); END;");



            // Update Reserva

            const resultadoPago = await connection.execute("UPDATE reservas set estador_idestado = 2 where idreserva = " + id + "");

            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.contentType('application/json').status(200);
            res.send(JSON.stringify(1));



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
    insertarPagoRestante(id);


});
app.get('/api/departamentoactivo/:lugar', function (req, res) {
    var lugar = req.params.lugar;
    console.log("lugar" + lugar);
    var fechaInicio = req.body.fechaInicio;
    var fechaTermino = req.body.fechaTermino;
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
        connection.execute(" select d.iddepartamento, d.descripciond, d.nombred,d.direcciond, d.valordepartamento, d.comuna_idcomuna , d.activo , c.nombrecomuna , id.rutaimagen from departamento d   join comuna c   on c.idcomuna = d.comuna_idcomuna  join imagendepa id  on id.departamento_iddepartamento = d.iddepartamento  where c.nombrecomuna like '%" + lugar + "%' AND d.activo =1  group by d.iddepartamento, d.descripciond, d.nombred,d.direcciond, d.valordepartamento, d.comuna_idcomuna , d.activo , c.nombrecomuna , id.rutaimagen ", {}, {

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

app.listen(3001, 'localhost', function () {
    console.log("Puerto 3001");
});

