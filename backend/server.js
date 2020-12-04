const express = require('express');
const mysql = require('mysql');
const DATABASE = require('./utilities/createDB');
const TABLES = require('./utilities/createTables');
const cred = require('./utilities/credentials');

class LIBRARY {

    constructor(port, app) {

        this.port = port;
        this.app = app;
        this.app.use(express.json())
        this.temp = 0;

        
        new DATABASE().initDB();

        
        new TABLES().initTable();
        
        this.db = mysql.createConnection({
            ...cred,
            database: 'library'
        });

    }

    get() {

        
        this.app.get('/api/getBooks', (req, res) => {
            let sql = `SELECT * FROM book`;
            this.db.query(sql, (err, result) => {
                if(err)
                    console.log(err);
                else
                    console.log("Successfully extracted books");
                res.send(result);
            });
        });

        
        this.app.get('/api/getBooks/:id', (req, res) => {
            let sql = `SELECT * FROM book where semester = '${req.params.id}'`;
            this.db.query(sql, (err, result) => {
                if(err)
                    console.log(err);
                else
                    console.log("Successfully extracted books");
                res.send(result);
            });
        });

    
        this.app.post('/api/borrow', (req, res) => {
            let sql = [`INSERT INTO BORROW(idStudent, idBook) VALUES (${req.body.sid}, ${req.body.id});`,
                       `Update BOOK SET count = count - 1 WHERE id = ${req.body.id}`];

                for(let i = 0; i < sql.length; i++){
                    this.db.query(sql[i], (err, result) => {
                        if(err){
                            console.log("Couldn't add");
                            this.temp = 1;
                        }
                        else
                            console.log("Successfully inserted");
                    });
                    if(this.temp)
                        break;
                }
        });

        
        this.app.get('/api/getIssues/:sid', (req, res) => {
            
            let sql = `SELECT book.name, book.author, book.semester, book.id, borrow.date, borrow.deadline, student.name as sname\
                       FROM book, student, borrow\
                       where borrow.idStudent = '${req.params.sid}' and book.id = borrow.idBook and student.id = '${req.params.sid}'`;

            this.db.query(sql, (err, result) => {
                if(err)
                    console.log(err);
                else
                    console.log("Successfully extracted issues");
                res.send(result);
            });
        });

        
        this.app.post('/api/return', (req, res) => {
            
            let sql = [`SELECT deadline from borrow\
                        WHERE idBook = ${req.body.id} and idStudent = ${req.body.sid}`,
                       `DELETE FROM borrow where idStudent = ${req.body.sid} and idBook = ${req.body.id}`,
                       `UPDATE BOOK SET count = count + 1 WHERE id = ${req.body.id}`];

            for(let i = 0; i < sql.length; i++){
                this.db.query(sql[i], (err, result) => {
                    if(err){
                        console.log("Couldn't return");
                    }
                    
                    
                    else if(i == 0){
                        var d1 = new Date(result[0].deadline);
                        var d2 = new Date()
                        const timeDiff = d2 - d1;
                        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                        if(daysDiff > 0) {
                            this.db.query(`UPDATE STUDENT SET fine = fine + ${(daysDiff - 1) * 10} WHERE id = '${req.body.sid}'`, (err, result) => {
                                if(err)
                                    console.log(err);
                                else
                                    console.log("Fine Updated Succesfully");
                            });
                        }
                    }

                });
            }
        });

        
        this.app.get('/api/students/:id', (req, res) => {
            
            let sql = `SELECT student.name, borrow.date, borrow.deadline\
                       FROM student, borrow\
                       where borrow.idBook = '${req.params.id}' and student.id = borrow.idStudent`;

            this.db.query(sql, (err, result) => {
                if(err)
                    console.log("Couldn't get issues");
                else
                    console.log("Successfully extracted issues");
                res.send(result);
            });
        });
    }

    listen() {
        this.app.listen(this.port, (err) => {
            if(err)
                console.log(err);
            else
                console.log(`Server Started On ${this.port}`);
        })
    }
    
}

let library = new LIBRARY(3002, express());
library.get();
library.listen();