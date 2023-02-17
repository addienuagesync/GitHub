/**
 * Called from integrator.io prior to mapping the data
 * @param  {Object} options The data sent to the hook.  See SampleOptionsData.json for format
 * @return {Array}         Array containing the data sent to the mapper
 */
var fetchGERefTransactionsPreMapHook = function(options){
	
	//The array that will be returned from this hook to be processed by the mappings
	var response = [];
	var tempData = options.data

	if(tempData.length > 0) {
    	for (var i = 0; i < tempData.length; i++) {

			//Fetch the Cash Sales data
			if(tempData[i].newGERefArr_cahSales.length > 0) {
				var cashSalesObj = fetchNSRecordsData(tempData[i].cashsales_arr,tempData[i].newGERefArr_cahSales,tempData[i].cashSalesGERefRecords,'cashsale','CashSale')
			} 
			
			//Fetch the Cash Refund Data
			if(tempData[i].newGERefArr_cahRefunds.length > 0) {
				var cashRefundObj = fetchNSRecordsData(tempData[i].cashrefunds_arr,tempData[i].newGERefArr_cahRefunds,tempData[i].cashRefundsGERefRecords,'cashrefund','CashRfnd')
			}

			tempData[i].paymentArr = cashSalesObj.paymentArr.concat(cashRefundObj.paymentArr)
			tempData[i].missingGERefsArr = cashSalesObj.missingGERefsArr.concat(cashRefundObj.missingGERefsArr)

			
			var missingRecords = []
			var errorMsg = ''
			
			/*
			if(cashSalesObj.GERefNumbersArr.length > 0) {
				errorMsg = 'Missing Order records ' +  cashSalesObj.GERefNumbersArr + ' '
			}

			if(cashRefundObj.GERefNumbersArr.length > 0) {
				errorMsg = errorMsg + 'Missing Refund records ' +  cashRefundObj.GERefNumbersArr 
			}

			missingRecords.push({
				code : 'MISSING_TRANSACTIONS',
				message : errorMsg
			})
			*/
			
		response.push({
			data : JSON.parse(JSON.stringify(tempData[i])),
			errors : missingRecords
		});
		}
 	}

	try {
		logOptions(options, response);
	} catch (e) {
		nlapiLogExecution('ERROR', e.name, e.message);
		/*In the case of a high level failure all records should be marked as failed
		If there is a single record failure the individual error should be logged in the function called
		within the try-catch block
		*/
		for (var i = 0; i < response.length; i++) {
			response[i].data = null;
			response[i].errors.push({
				code : e.name,
				message : e.message
			});
		}
	}

	//Send the data to the mappings
	return response;

};

/**
 * Log the data passed into the hook into the SuiteScript logs of the RESTlet
 * @param  {Object} options  Data passed into the PreMap hook
 * @param  {Array} response The object that is passed on to the mappings
 * @return null
 */
var logOptions = function(options, response){
	nlapiLogExecution('AUDIT', 'PreMap Options', JSON.stringify(options));
};

//To fetch the NetSuite Document Numbers Cash Sales and Cash Refunds for the GERefNumbers available from the Celigo Input Data
var fetchNSRecordsData = function(inputArr,GERefNumbersArr,GERefRecordsObj,nsRecordType,nsFilterType) {
		
	var filter1 = ["formulanumeric: case when {otherrefnum} in ('$$$') then 1 else 0 end","equalto","1"]
	
	var newGERefArr = GERefNumbersArr.join("','")

	filter1[0] = filter1[0].replace('$$$',newGERefArr)

	nlapiLogExecution('audit','Premap ' + nsRecordType + ' Search Filters :',JSON.stringify(newGERefArr));
	nlapiLogExecution('audit',nsRecordType + ' Array Length :',JSON.stringify(GERefNumbersArr.length));

	var GERerRecordsSearch = nlapiSearchRecord(nsRecordType,null,
		[
		["type","anyof",nsFilterType], 
		"AND", 
		filter1,
		"AND", 
		["mainline","is","T"]
		], 
		[
		new nlobjSearchColumn("type"), 
		new nlobjSearchColumn("tranid"), 
		new nlobjSearchColumn("otherrefnum"), 
		new nlobjSearchColumn("internalid")
		]
		);

	var paymentArr = []
	var tempGERefNumbersArr = GERefNumbersArr

	nlapiLogExecution('audit','Search Result Length ' + nsRecordType + ' :',JSON.stringify(GERerRecordsSearch.length));

/*** To add NS Document number to the Data and remove the them from the tempGERefNumbersArr 
whenever a NS doc number is found for a GERef Number ***/
	for(var p=GERerRecordsSearch.length-1; p >= 0 ; p--) {
		var refNum =''
		refNum = GERerRecordsSearch[p].getValue('otherrefnum')
		var x = GERefRecordsObj[refNum]

		//nlapiLogExecution('audit','GERefObjs ' + nsRecordType + ' :',JSON.stringify(x));
		
		x.nsDocNum = GERerRecordsSearch[p].getValue('tranid')
		
		//nlapiLogExecution('audit','GERefObjs After nsDocNum ' + nsRecordType + ' :',JSON.stringify(x));

		paymentArr.push(x)

		var tempGERefNumbersArr = tempGERefNumbersArr.filter(function (GERefToRemove) {
			return GERefToRemove !== refNum;
		});

		
		//GERefNumbersArr.splice(GERefNumbersArr.indexOf(refNum),1)
		
		//nlapiLogExecution('audit','Deleted GERefNumberArr Length ('+nsRecordType+') :',JSON.stringify(GERefNumbersArr.length));
	}

	nlapiLogExecution('audit','Missing GERefNumberArr ('+nsRecordType+') :',JSON.stringify(tempGERefNumbersArr));

	var missingGERefsArr =  []
	var missingGERefsErrorArr = []
	
	//var tempUniqueGERefNumbersArr = removeDuplicates(tempGERefNumbersArr)

	//Generate Missing Records Array
	if(tempGERefNumbersArr.length > 0) {
	
		var tempUniqueGERefNumbersArr = []

		for(var r=0; r<tempGERefNumbersArr.length;r++) {
			if (tempUniqueGERefNumbersArr.indexOf(tempGERefNumbersArr[r]) == -1) {
				tempUniqueGERefNumbersArr.push(tempGERefNumbersArr[r]);
			}
		}
		nlapiLogExecution('audit','Missing GERefNumberArr After Removing Duplicates ('+nsRecordType+') :',JSON.stringify(tempUniqueGERefNumbersArr));

		for(var q = 0; q<tempUniqueGERefNumbersArr.length;q++) {

			missingGERefsArr.push(GERefRecordsObj[tempUniqueGERefNumbersArr[q]])

			/*
			missingGERefsErrorArr.push({
				code : 'MISSING_TRANSACTION',
				message : 'Missing this transaction ' +  GERefNumbersArr[q]
			})
			*/
			
		}
		
		nlapiLogExecution('audit','missingGERefsArr ('+nsRecordType+') :',JSON.stringify(missingGERefsArr));
		//nlapiLogExecution('audit','missingGERefsErrorArr ('+nsRecordType+') :',JSON.stringify(missingGERefsErrorArr));
	}

	var outputObj = {}
	outputObj.paymentArr = paymentArr
	outputObj.GERefNumbersArr = tempUniqueGERefNumbersArr
	outputObj.missingGERefsArr = missingGERefsArr
	outputObj.missingGERefsErrorArr = missingGERefsErrorArr

	return outputObj
}

/*
var removeDuplicates = function(tempGERefNumbersArr) {
	return tempGERefNumbersArr.filter((item, index) => tempGERefNumbersArr.indexOf(item) === index);
}*/