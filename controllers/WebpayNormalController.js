const Transbank = require("transbank-sdk")
var oracledb = require('oracledb');
var connAttrs = {
  "user": "SATUR",
  "password": "bB2tV6fR1fG",
  "connectString": "(DESCRIPTION =(LOAD_BALANCE = ON)(FAILOVER = ON)(ADDRESS =(PROTOCOL = TCP)(HOST = satur.docn.us)(PORT = 1521))(ADDRESS = (PROTOCOL = TCP)(HOST = satur.docn.us )(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=str.docn.us)(FAILOVER_MODE=(TYPE=SELECT)(METHOD = BASIC))))"
}
const transactions = {}

class WebpayPlusController {
  static init(req, res) {
    const configuration = Transbank.Configuration.forTestingWebpayPlusNormal()
    let Webpay = new Transbank.Webpay(configuration).getNormalTransaction()
    let url = "http://" + req.get("host")
    let amount = req.body.total;
    let idReserva = req.body.idReserva;
    let motivo = req.body.motivo;

    async function insertarPago(tokenws) {
      let conn;
      try {
        conn = await oracledb.getConnection(connAttrs);

        console.log('Connected to database');

        let lastId = await conn.execute(
          'SELECT MAX(idpago) as "id" from pagos',
          [],
          {
            outFormat: oracledb.OBJECT
          });


        console.log("Filas " + lastId.rows[0].id);
        var idLast = lastId.rows[0].id;
        if (idLast == null) {
          var idLast = 1;

        } else {
          var idLast = idLast + 1;
        }


        let result = await conn.execute(
          "INSERT INTO PAGOS VALUES (" + idLast + ",'" + tokenws + "',(TO_DATE(sysdate, 'dd/mm/yyyy hh24:mi:ss')),0,'" + idReserva + "','" + amount + "','"+motivo+"')"

        );
        console.log("Insertadoi");
      } catch (err) {
        console.log('Error in processing', err);
      } finally {
        if (conn) { // conn assignment worked, need to close
          try {
            await conn.close();

            console.log('Connection closed');
          } catch (err) {
            console.log('Error closing connection', err);
          }
        }
      }

    }

    Webpay.initTransaction(
      amount,
      "Orden" + 15552,
      req.sessionId,
      url + "/webpay-normal/response",
      url + "/webpay-normal/finish").then((data) => {
        transactions[data.token] = { amount: amount }
        insertarPago(data.token);
        res.render("redirect-transbank",
          { url: data.url, token: data.token, inputName: "TBK_TOKEN" })
      })
  }

  static response(req, res) {
    // Esta inicialización que se repite, es mejor llevarla a nu lugar en donde
    // se pueda reutilizar. Por simplicidad, en este ejemplo está el código
    // duplicado en cada método
    const configuration = Transbank.Configuration.forTestingWebpayPlusNormal()
    let Webpay = new Transbank.Webpay(configuration).getNormalTransaction()

    let token = req.body.token_ws


    Webpay.getTransactionResult(token).then(response => {
      transactions[token] = response
      var estadoTransaccion = response.detailOutput[0].responseCode;
      async function updatePago(token_ws) {
        let conn;
        try {
          conn = await oracledb.getConnection(connAttrs);

          console.log('Connected to database');
          let result = await conn.execute(
            "UPDATE PAGOS set estadopago = 1 where tokenpago = '" + token_ws + "' "
          );

          console.log("Actualizado");
        } catch (err) {
          console.log('Error in processing', err);
        } finally {
          if (conn) { // conn assignment worked, need to close
            try {
              await conn.close();

              console.log('Connection closed');
            } catch (err) {
              console.log('Error closing connection', err);
            }
          }
        }

      }
      if (estadoTransaccion === 0) {

        updatePago(token);
      }
      res.render("redirect-transbank",
        { url: response.urlRedirection, token, inputName: "token_ws" }

      )
    }).catch((e) => {
      console.log(e)
      res.send("Error")
    })
  }
  static finish(req, res) {
    let status = null;
    let transaction = null;

    // Si se recibe TBK_TOKEN en vez de token_ws, la compra fue anulada por el usuario
    if (typeof req.body.TBK_TOKEN !== "undefined") {
      status = 'ABORTED';
    }

    if (typeof req.body.token_ws !== "undefined") {
      transaction = transactions[req.body.token_ws];
      if (transaction.detailOutput[0].responseCode === 0) {
        status = 'AUTHORIZED';
      } else {
        status = 'REJECTED';
      }
    }

    // Si no se recibió ni token_ws ni TBK_TOKEN, es un usuario que entró directo
    if (status === null) {
      return res.status(404).send("Not found.");
    }


    return res.render("webpay-normal/finish", { transaction, status })

  }

  static initRestante(req, res) {
    const configuration = Transbank.Configuration.forTestingWebpayPlusNormal()
    let Webpay = new Transbank.Webpay(configuration).getNormalTransaction()
    let url = "http://" + req.get("host")
    let amount = req.body.total;
    let idReserva = req.body.idReserva;
    let motivo = req.body.motivo;

    async function insertarPago(tokenws) {
      let conn;
      try {
        conn = await oracledb.getConnection(connAttrs);

        console.log('Connected to database');

        let lastId = await conn.execute(
          'SELECT MAX(idpago) as "id" from pagos',
          [],
          {
            outFormat: oracledb.OBJECT
          });


        console.log("Filas " + lastId.rows[0].id);
        var idLast = lastId.rows[0].id;
        if (idLast == null) {
          var idLast = 1;

        } else {
          var idLast = idLast + 1;
        }


        let result = await conn.execute(
          "INSERT INTO PAGOS VALUES (" + idLast + ",'" + tokenws + "',(TO_DATE(sysdate, 'dd/mm/yyyy hh24:mi:ss')),0,'" + idReserva + "','" + amount + "','"+motivo+"')"

        );

        
        console.log("Insertadoi");
      } catch (err) {
        console.log('Error in processing', err);
      } finally {
        if (conn) { // conn assignment worked, need to close
          try {
            await conn.close();

            console.log('Connection closed');
          } catch (err) {
            console.log('Error closing connection', err);
          }
        }
      }

    }

    Webpay.initTransaction(
      amount,
      "Orden" + 15552,
      req.sessionId,
      url + "/webpay-normal/responseRestante",
      url + "/webpay-normal/finishRestante").then((data) => {
        transactions[data.token] = { amount: amount }
        insertarPago(data.token);
        res.render("redirect-transbank",
          { url: data.url, token: data.token, inputName: "TBK_TOKEN" })
      })
  }

  static responseRestante(req, res) {
    // Esta inicialización que se repite, es mejor llevarla a nu lugar en donde
    // se pueda reutilizar. Por simplicidad, en este ejemplo está el código
    // duplicado en cada método
    const configuration = Transbank.Configuration.forTestingWebpayPlusNormal()
    let Webpay = new Transbank.Webpay(configuration).getNormalTransaction()

    let token = req.body.token_ws


    Webpay.getTransactionResult(token).then(response => {
      transactions[token] = response
      var estadoTransaccion = response.detailOutput[0].responseCode;
      async function updatePago(token_ws) {
        let conn;
        try {
          conn = await oracledb.getConnection(connAttrs);

          console.log('Connected to database');
          let result = await conn.execute(
            "UPDATE PAGOS set estadopago = 1 where tokenpago = '" + token_ws + "' "
          );

          let idReserva = await conn.execute(
            "select reservas_idreserva as id from pagos where tokenpago = '"+token_ws+"' ",
            [],
            {
              outFormat: oracledb.OBJECT
            });
  
  
          console.log("FFilas " + idReserva.rows[0].id);
        
            // Update Reserva

          resultadoPagoRestante = await connection.execute("UPDATE reservas set estador_idestado = 2 where idreserva = " + idReserva.rows[0].id + "");

          console.log("Actualizado");
        } catch (err) {
          console.log('Error in processing', err);
        } finally {
          if (conn) { // conn assignment worked, need to close
            try {
              await conn.close();

              console.log('Connection closed');
            } catch (err) {
              console.log('Error closing connection', err);
            }
          }
        }

      }
      if (estadoTransaccion === 0) {

        updatePago(token);
      }
      res.render("redirect-transbank",
        { url: response.urlRedirection, token, inputName: "token_ws" }

      )
    }).catch((e) => {
      console.log(e)
      res.send("Error")
    })
  }
  static finishRestante(req, res) {
    let status = null;
    let transaction = null;

    // Si se recibe TBK_TOKEN en vez de token_ws, la compra fue anulada por el usuario
    if (typeof req.body.TBK_TOKEN !== "undefined") {
      status = 'ABORTED';
    }

    if (typeof req.body.token_ws !== "undefined") {
      transaction = transactions[req.body.token_ws];
      if (transaction.detailOutput[0].responseCode === 0) {
        status = 'AUTHORIZED';
      } else {
        status = 'REJECTED';
      }
    }

    // Si no se recibió ni token_ws ni TBK_TOKEN, es un usuario que entró directo
    if (status === null) {
      return res.status(404).send("Not found.");
    }


    return res.render("webpay-normal/finish", { transaction, status })

  }

}

module.exports = WebpayPlusController
