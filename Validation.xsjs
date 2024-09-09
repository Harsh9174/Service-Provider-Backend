var providerNames = [];
var vendorIds = [];
var conn;

try {
    // get the json
    var requestBody = JSON.parse($.request.body.asString());

    if (!Array.isArray(requestBody)) {
        throw new Error("Invalid payload format. Expected an array of objects.");
    }

    // Extracts all the details of service provider
    for (var i = 0; i < requestBody.length; i++) {
        var PServiceProviderName = requestBody[i].SERVICEPROVIDER_NAME;
        var PSADARAVENDOR_ID = requestBody[i].SADARAVENDOR_ID;
        var PCREATIONDATETIME = requestBody[i].CREATIONDATETIME;
        var CREATEDBY = requestBody[i].CREATEDBY;
        var PUPDATEDATETIME = requestBody[i].UPDATEDATETIME;
        var UPDATEDBY = requestBody[i].UPDATEDBY;
        var DELETIONFLAG = requestBody[i].DELETIONFLAG;
        
        // Appending the provider name and vendor id in an array
        if (PServiceProviderName) {
            providerNames.push("'" + PServiceProviderName.replace(/'/g, "''") + "'"); // Escape single quotes
        }
        if (PSADARAVENDOR_ID) {
            vendorIds.push("'" + PSADARAVENDOR_ID.replace(/'/g, "''") + "'"); // Escape single quotes
        }
    }

    // Check if provider name and vendor id have values to avoid empty IN clause
    if (providerNames.length === 0 && vendorIds.length === 0) {
        throw new Error("No valid provider names or vendor IDs found in the request.");
    }

    // Get a connection to the database
    conn = $.hdb.getConnection();
    conn.setAutoCommit(false); // Start transaction

    // checking if the json contains duplicates and validating that from database
    var query =
        'SELECT "SERVICEPROVIDER_NAME", "SADARAVENDOR_ID" ' +
        'FROM "BTP_CUSTOMAPPS"."SDR.ServiceProviders.Tables::SERVICE_PROVIDER_MASTER" ' +
        'WHERE "SERVICEPROVIDER_NAME" IN (' + providerNames.join(",") + ') ' +
        'OR "SADARAVENDOR_ID" IN (' + vendorIds.join(",") + ')';

    // Execute the query
    var resultSet = conn.executeQuery(query);

    // Check if any records were returned
    if (resultSet.length > 0) {
        throw new Error("Duplicate provider name and vendor ID combinations found." + providerNames + vendorIds);
    }

    // To insert the non duplicated records into table
    for (var i = 0; i < requestBody.length; i++) {
        var PServiceProviderName = requestBody[i].SERVICEPROVIDER_NAME;
        var PSADARAVENDOR_ID = requestBody[i].SADARAVENDOR_ID;
        var PCREATIONDATETIME = requestBody[i].CREATIONDATETIME;
        var CREATEDBY = requestBody[i].CREATEDBY;
        var PUPDATEDATETIME = requestBody[i].UPDATEDATETIME;
        var UPDATEDBY = requestBody[i].UPDATEDBY;
        var DELETIONFLAG = requestBody[i].DELETIONFLAG;

        //  INSERT statement with all the required fields
        var insertQuery = 
            'INSERT INTO "BTP_CUSTOMAPPS"."SDR.ServiceProviders.Tables::SERVICE_PROVIDER_MASTER" ' +
            '("SERVICEPROVIDER_ID", "SERVICEPROVIDER_NAME", "SADARAVENDOR_ID", "CREATIONDATETIME", "CREATEDBY", "UPDATEDATETIME", "UPDATEDBY", "DELETIONFLAG") ' +
            'VALUES ("BTP_CUSTOMAPPS"."SDR.ServiceProviders.Sequences::SERVICE_PROVIDERS".nextval, ' + 
            "'" + PServiceProviderName.replace(/'/g, "''") + "', " +
            "'" + PSADARAVENDOR_ID.replace(/'/g, "''") + "', " +
            "'" + PCREATIONDATETIME + "', " +
            "'" + CREATEDBY + "', " +
            "'" + PUPDATEDATETIME + "', " +
            "'" + UPDATEDBY + "', " +
            "'" + DELETIONFLAG + "'" +
            ')';

        // Execute the INSERT statement
        var rowsAffected = conn.executeUpdate(insertQuery);
        if (rowsAffected === 0) {
            throw new Error("Failed to insert record: " + JSON.stringify(requestBody[i]));
        }
    }
    // explicit commit 
    conn.commit();
    
    // setting up the output response
    $.response.status = $.net.http.OK;
    $.response.contentType = "application/json";
    $.response.setBody(JSON.stringify({ message: "No duplicates found. Insert operation successful." }));

} catch (err) {
    if (conn) {
        conn.rollback(); 
    }
    $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
    $.response.setBody(JSON.stringify({ error: err.message }));
} finally {
    if (conn) {
        conn.close();
    }
}