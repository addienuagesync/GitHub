/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 *@NModuleScope Public
 */
 define(['N/email','N/file','N/search','N/runtime'], (email,file,search,runtime) => {

    function execute(context){
    
        log.audit("Bulk Emails SuiteScript Triggered");
        const senderId = 8732;
              
        var scriptObj = runtime.getCurrentScript();

        
        var summaryReceiverEmail = scriptObj.getParameter({name: 'custscript_nuagesync_summaryreceivemail'});
        var summaryCCEmail = scriptObj.getParameter({name: 'custscript_nuagesync_summaryccemails'});      
        var emailSubject = scriptObj.getParameter({name: 'custscript_nuagesync_emailsubject'});
        var emailBody = scriptObj.getParameter({name:'custscript_nuagesync_emailbody'});
        var attachmentId = scriptObj.getParameter({name: 'custscript_nuagesync_attachmentid'});
        

        log.audit('Script parameter of Summary Receiver Email: ' + summaryReceiverEmail);
        log.audit('Script parameter of Summary Receiver Email: ' + summaryCCEmail);
        log.audit('Script parameter of Summary Receiver Email: ' + emailSubject);
        log.audit('Script parameter of Summary Receiver Email: ' + emailBody);
        log.audit('Script parameter of Summary Receiver Email: ' + attachmentId);

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

        var emailHtmlBody = `<html>
        <head>
            <meta charset="utf-8"><title></title>
            <style>table, th, td {
                border: 1px solid black;
              }
              </style>
        </head>
        <body>`
        
        emailHtmlBody += `<p>Hi,<br>`

        emailHtmlBody += `Below is the summary of Bulk Emails Trigger<br>`

        emailHtmlBody += `Total Customers: ${searchResultCount}<br>`

        emailHtmlBody += `Emails Sent: ${emailsuccesfullcount}<br>`

        emailHtmlBody += `Emails Failed: ${emailfailedcount}<br>`

        emailHtmlBody += `Missing emails Customer IDs list ['${missingEmailsCustIds.join("','")}']<br>`
        
        emailHtmlBody += `<table border: 1px solid black>
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
                recipients: summaryReceiverEmail,
                cc: [summaryCCEmail] || '',
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