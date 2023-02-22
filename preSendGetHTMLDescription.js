
function preSendGetHTMLDesc(options) {

    for(var j =0; j<options.data.length; j++){
        var ItemData = options.data[j]
        var ItemID = ItemData.id
    
        var itemRecord = nlapiLoadRecord('inventoryitem', ItemID,{recordmode: 'dynamic'});
        var itemDesc = itemRecord.getFieldValue('description')
        if(itemDesc) {

        
            
            //var desc = _.escape(_.unescape(itemDesc || ''))
            var desc = _.unescape(itemDesc || '')
            
        }
        if(desc){
        
            options.data[j].htmlDesc = desc
        
        }
    
    }
    return {
      data: options.data,
      errors: options.errors
    }
  }
  