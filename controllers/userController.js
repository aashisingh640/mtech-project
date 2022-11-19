const jsforce = require('jsforce');
const jwt = require('jsonwebtoken');

let connection = null;

async function authenticate(req, res) {
    try {
        
        const { username, password } = req.body;
    
        connection = await makeConnection(username, password);

        console.log(connection.userInfo);

        const sobject = 'User';
        const fields = 'Id, Name, FirstName, LastName, Username, Email';
        const whereClause = `Id = '${connection.userInfo.id}'`;

        const userList = await fetchRecords(sobject, fields, whereClause);

        const jwtToken = await generateToken(password);

        let user = null;

        if (userList.length > 0) {
            user = userList[0];
        } else {
            return res.status(401).json({ msg: 'User not found' })
        }

        user.accessToken = connection.accessToken;
        user.instanceUrl = connection.instanceUrl;
        user.jwtToken = jwtToken;
    
        return res.json({ user });

    } catch (error) {
        console.log(error);
        return res.status(401).json({ msg: error.message })
    }
}

function makeConnection(username, password) {

    return new Promise(async (resolve, reject) => {
        try {

            const token = 'okFarOuwkpOESWLMJsP6hWxSR';

            const connection = new jsforce.Connection({});
            await connection.login(username, `${password}${token}`);
            resolve(connection);

        } catch (err) {
            console.log('error in makeConnection - ', err)
            reject(err);
        }
    })

}

function generateToken(payload) {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await jwt.sign(payload, process.env.AUTHORIZATION_TOKEN);
            resolve(token);
        } catch (error) {
            console.log('error in generating token --', error);
            reject(error);
        }
    })
}

function fetchRecords(sobject, fields, whereClause) {
    return new Promise(async (resolve, reject) => {
        try {
            const records = await connection
                .sobject(sobject)
                .select(fields)
                .where(whereClause)
                .execute();

            resolve(records);

        } catch (error) {
            console.log('error in fetchRecords - ', error);
            reject(error);
        }
    })
}

module.exports = { authenticate, connection };