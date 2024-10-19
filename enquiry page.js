frappe.ui.form.on("Enquiry Page", "contact_number", function(frm, cdt, cdn) {  
            var p = frm.doc;
             if (p.contact_number.toString().length>10 || p.contact_number.toString().length<10)
             {
             	frappe.msgprint("Contact Number should be 10 digits!");

             }
            
     });

frappe.ui.form.on("Enquiry Page", "contact_email", function(frm, cdt, cdn) {  
            var p = frm.doc;
             var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
             if(!emailReg.test( p.contact_email ))
             {
             	frappe.msgprint("Email address in not valid!");

             }
            
     });

frappe.ui.form.on("Enquiry Page", "refresh", function(frm, cdt, cdn) {  
            var p = frm.doc;
            var po=[]
            var u=[];

              frappe.call({
                    "method": "frappe.client.get",
                    args: {
                            doctype: "User",  
                            filters: {
                                email:["=", frappe.session.user]
                            }
                        },
                    callback: function(data){
                            console.log(data);
                            if (data.message.user_type_for_enquiry=="Admin")
                            {
                            	cur_frm.set_df_property(“allocated_to_convertor” , “hidden”, 1);
                            }
                            for(var i=0; i < data.message.product_offering.length; i++){
						po.push( data.message.product_offering[i].product_name);
						
					}
					frappe.meta.get_docfield("Enquiry Page", "product_type", cur_frm.docname).options = po;
					frm.refresh_field('product_type');
                             }
                         });


            	frappe.call({
			"method": "frappe.client.get_list",
			args: {
					doctype: "User",
					fields: ["full_name"],
					filters: {
						user_type_for_enquiry:["=", "Convertor"]
					}
				},
			callback: function(data){
					console.log(data);
					for(var i=0; i < data.message.length; i++){
						u.push( data.message[i].full_name);
						
					}
					frappe.meta.get_docfield("Enquiry Page", "allocated_to_convertor", cur_frm.docname).options = u;
					frm.refresh_field('allocated_to_convertor');
			}
		});
     });