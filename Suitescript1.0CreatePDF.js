function myPreSendHook(options) {
    nlapiLogExecution('DEBUG', 'preSendoptions', JSON.stringify(options.data));
    var searchData = options.data
   nlapiLogExecution('audit','searchData',JSON.stringify(searchData));
    var response = { data : [], errors : []}
    //do processing on searchData
    //generate PDF for each id searchData and return FileIds
   for(var i=0;i<searchData.length;i++) {
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
 
 function printRecordAsFile(recordType, recordId, recordDocNumb, folder) {
   
   nlapiLogExecution('audit','searchData',JSON.stringify(recordType + "_" + recordId + "_" + recordDocNumb + '_' + folder));
     if(!recordType || !recordId || !folder)
        return; 
 
     var response = {}
     try{
         var recordFile = nlapiPrintRecord('transaction', recordId, 'PDF')
         recordFile.setFolder(folder)
         recordFile.setName('NS_' + recordType + '_' + recordDocNumb)
         var fileId = nlapiSubmitFile(recordFile)
        // nlapiLogExecution('audit','fileId',JSON.stringify(fileId));
         response.success = true
         response.Id = fileId
           response.fileName = 'NS_' + recordType + '_' + recordDocNumb
       nlapiLogExecution('audit','fileId',JSON.stringify(fileId));
       nlapiLogExecution('audit','FileName',JSON.stringify(response.fileName));
 
     } catch(ex) {
      nlapiLogExecution('Error','Error while saving file recordType'+recordType+'| recordId# '+recordId, ex.code)
         response.success = false
         response.error = "Error while saving file"+ex.name + ' | '+ ex.message
 
     }
     return response
 }
 
 
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