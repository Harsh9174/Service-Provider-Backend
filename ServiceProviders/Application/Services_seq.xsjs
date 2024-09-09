var results = {};                                        

try {

var conn = $.hdb.getConnection(); 
                //--> HDB proceude and scheman name                       
//var query = conn.loadProcedure("BTP_CUSTOMAPPS", "SDR.ServiceProviders::test"); 
//   results = query();
   
var query1 = ' select "BTP_CUSTOMAPPS"."SDR.ServiceProviders.Sequences::SERVICES".NEXTVAL AS VALUE from dummy ';

results = conn.executeQuery(query1); 
   
                                           
$.response.status = $.net.http.OK;                                   
$.response.contentType = "application/json";
           //--> set response body with result output
$.response.setBody(JSON.stringify(results));                         
          //--> Error handeling                                                                        
} catch (err) {                                                     

$.response.setBody(err.message);
}
conn.commit();
conn.close();