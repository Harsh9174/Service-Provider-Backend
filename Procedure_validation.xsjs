var results = {};

try {
    // Retrieve the request body
    var requestBody = JSON.parse($.request.body.asString());

    // Extract parameters from the request body
    var PServiceProviderName = requestBody.SERVICEPROVIDER_NAME;
    var PSADARAVENDOR_ID = requestBody.SADARAVENDOR_ID;

    if (!PServiceProviderName || !PSADARAVENDOR_ID) {
        throw new Error("Required parameters are missing.");
    }

    var conn = $.hdb.getConnection();

    // Check if the combination of SERVICEPROVIDER_NAME and SADARAVENDOR_ID already exists
    var queryCheck = '"SELECT COUNT(*) AS COUNT FROM "BTP_CUSTOMAPPS"."SDR.ServiceProviders.Tables::SERVICE_PROVIDER_MASTER" WHERE SERVICEPROVIDER_NAME = ? AND SADARAVENDOR_ID = ?" ';
    var pstmt = conn.prepareStatement(queryCheck);
    pstmt.setString(1, PServiceProviderName);
    pstmt.setString(2, PSADARAVENDOR_ID);
    var rs = pstmt.executeQuery();
    rs.next();
    var count = rs.getInt(1);
    rs.close();
    pstmt.close();

    if (count > 0) {
        // Duplicate found, throw an error
        throw new Error("Duplicate entry: The combination of SERVICEPROVIDER_NAME and SADARAVENDOR_ID already exists.");
    }

    // If no duplicate is found, proceed with calling the procedure
    var query = conn.loadProcedure("BTP_CUSTOMAPPS", "SDR.ServiceProviders.Procedures::Service_provider_seq");
    results = query(PServiceProviderName, PSADARAVENDOR_ID);

    $.response.status = $.net.http.OK;
    $.response.contentType = "application/json";
    $.response.setBody(JSON.stringify(results));
} catch (err) {
    $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
    $.response.setBody(JSON.stringify({ error: err.message }));
} finally {
    if (conn) {
        conn.commit();
        conn.close();
    }
}
