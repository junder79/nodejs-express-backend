class ReservaController {
    static crearReserva (req,res){
        console.log("DATOS " + JSON.stringify(req.body));

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
    
    
                // Insertar en tabla Pago 
    
                const resultadoPago = await connection.execute("BEGIN sp_agregar_pago('UUA87ANHAJYS' ,(TO_DATE(sysdate, 'dd/mm/yyyy hh24:mi:ss')),0,'" + idInsertado + "','" + valorAnticipadoInt + "','Pago Anticipado'); END;");
    
    
    
    
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
        })();
    }
}

module.exports = ReservaController;