function myPreSendHook(options) {
    
    var inputData = options.data
    nlapiLogExecution('DEBUG', 'preSendoptions', JSON.stringify(inputData));
    
    var response = { data : [], errors : []}
    //do processing on inputData
    
    //Get Item Descriptions
   for(var i=0;i<inputData.length;i++) {
     nlapiLogExecution('audit','searchData',JSON.stringify(searchData[i].recordType + "_" + searchData[i]['Document Number'] + '_' + searchData[i].id));
     var fileId = printRecordAsFile(searchData[i].recordType, searchData[i].id,searchData[i]['Document Number'],1415)
     nlapiLogExecution('audit','fileId',JSON.stringify(fileId));
     response.data.push({invoiceData: searchData[i],
                         fileId : fileId})
     
     try {
         logOptions(options, response);
     } catch (e) {
         nlapiLogExecution('ERROR', e.name, e.message);
         /*
          * the individual error should be logged in the function called within
          * the try-catch block
          */
         for (var i = 0; i < response.data.length; i++) {
             response.data[i] = null;
             response.errors.push({
                 code : e.name,
                 message : e.message
             });
         }
 
     }
   }
     
    return response
    //return options.data;
   
 };
 
 /**
  * Log the data passed into the hook into the SuiteScript logs of the RESTlet
  * @param  {Object} options  Data passed into the PreMap hook
  * @param  {Array} response The object that is passed on to the mappings
  * @return null
  */
 var logOptions = function(options, response){
     nlapiLogExecution('AUDIT', 'PreMap Options', JSON.stringify(options));
   nlapiLogExecution('AUDIT', 'PreMap response', JSON.stringify(response));
 };