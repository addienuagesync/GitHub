/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 *@NModuleScope Public
 */
 define(['N/email','N/file','N/search','N/runtime'], (email,file,search,runtime) => {

    function execute(context){
    
        log.audit("Bulk Emails SuiteScript Triggered");
        const senderId = 8732;
        const currentUserId = runtime.getCurrentUser().id;
        log.audit("Current user Id : " + currentUserId);
      
        var scriptObj = runtime.getCurrentScript();
      
        log.audit('Script parameter of Subject: ' + 
        scriptObj.getParameter({name: 'custscript_nuagesync_emailsubject'}));
        var emailSubject = scriptObj.getParameter({name: 'custscript_nuagesync_emailsubject'});	
        
        log.audit('Script parameter of Body: ' + 
        scriptObj.getParameter({name:'custscript_nuagesync_emailbody'}));
         var emailBody = scriptObj.getParameter({name:'custscript_nuagesync_emailbody'});
      
        log.audit('Script parameter of File ID: ' + 
        scriptObj.getParameter({name: 'custscript_nuagesync_attachmentid'}));
        var attachmentId = scriptObj.getParameter({name: 'custscript_nuagesync_attachmentid'});
      
        var mySearch=search.load({id:"customsearch_customers_bulkemails_nuage"});
        var results = mySearch.run().getRange({
        start: 0,
        end: 1000
        });
    
        let fileObj = file.load({
            id: attachmentId
        });

        var searchResultCount = results.length
        var emailsuccesfullcount = 0;
        var emailfailedcount = 0;
        var missingEmailsCustIds = [];
        var missingEmailsCustDetails = [];
    
        for(var i=0;i<results.length;i++) {
            var custName = results[i].getValue({
                name: 'entityid'
            });
            var custEmail = results[i].getValue({
                name: 'email'
            });
            var custId = results[i].getValue({
                name: 'internalid'
            });
             
            
            log.audit('Result Row: ' + i + ' Customer Name is ' + custName + ", email is " + custEmail + ', and customer ID is ' + custId);
          
            log.audit('Record Link: https://5060840.app.netsuite.com/app/common/entity/custjob.nl?id=' + custId);
          
          try {
            email.send({
                author: senderId,
                recipients: custId,
                subject: emailSubject,
                body: emailBody,
                attachments: [fileObj],
                
            });
            log.audit("Email sent to cusotmer " + custName + " with email address " + custEmail);
            emailsuccesfullcount++;

            } catch(e) {
            log.error("Uh oh. Error in the try/catch! - " + e.name, e.message);
            emailfailedcount++;
            missingEmailsCustDetails.push({"custId": custId, "custName": custName});
            missingEmailsCustIds.push(custId);
            }
            
        }

        var emailHtmlBody = `Hi,`
        emailHtmlBody += "\n"
        emailHtmlBody += `Below is the summary of Bulk Emails Trigger`
        emailHtmlBody += "\n"
        emailHtmlBody += `Total Customers: ${searchResultCount}`
        emailHtmlBody += "\n"
        emailHtmlBody += `Emails Sent: ${emailsuccesfullcount}`
        emailHtmlBody += "\n"
        emailHtmlBody += `Emails Failed: ${emailfailedcount}`
        emailHtmlBody += "\n"
        emailHtmlBody += `Missing emails Customers list [${missingEmailsCustIds.join("','")}]`
        emailHtmlBody += "\n"
        emailHtmlBody += `<html>
        <head>
            <meta charset="utf-8"><title></title>
            <style>table, th, td {
                border: 1px solid black;
              }
              </style>
        </head>
        <body>
            <table border: 1px solid black>
                <tr>
                    <th>Customers Missing Emails</th>
                </tr>
                <tr><td>`

        for(j=0;j<missingEmailsCustDetails.length;j++) {
            emailHtmlBody += `<a href='https://5060840.app.netsuite.com/app/common/entity/custjob.nl?id=${missingEmailsCustDetails[j].custId}'>${missingEmailsCustDetails[j].custName}</a><br>`
        }
                  
        emailHtmlBody += `</td></tr></table></body></html>`

        

        try {
            email.send({
                author: senderId,
                recipients: ['addie@nuagesync.com'],
                subject: `Bulk Emails Summary: Total-${searchResultCount}, Sent-${emailsuccesfullcount}, Failed-${emailfailedcount}`,
                body: emailHtmlBody      
            });
            log.audit("Email sent to cusotmer Addie with email address addie@nuagesync.com")
            } catch(e) {
            log.error("Uh oh. Error in the try/catch! - " + e.name, e.message);
            }

        log.audit("Bulk Emails SuiteScript Completed");
    
    }
    
    return {
        execute: execute
    }
    
    });