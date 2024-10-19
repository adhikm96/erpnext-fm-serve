frappe.ui.form.on("Sales Order", "job_type", function(frm, cdt, cdn) {
                var p = frm.doc;
                if(p.job_type=="One off service")
                {
                	frappe.model.set_value(p.doctype, p.name, "naming_series", "RPR-");				

                }
                else if (p.job_type=="Periodic Contract")
                {
                frappe.model.set_value(p.doctype, p.name, "naming_series", "CNT-");					
                }
            });

  frappe.ui.form.on("Sales Order", "refresh", function(frm, cdt, cdn) {
                var p = frm.doc;
                var d = locals[cdt][cdn];
                if(p.job_type=="One off service")
                {
                	frappe.model.set_value(p.doctype, p.name, "naming_series", "RPR-");				

                }
                else if (p.job_type=="Periodic Contract")
                {
                frappe.model.set_value(p.doctype, p.name, "naming_series", "CNT-");					
                }

                if (p.docstatus==1 && p.invoice_reference)
                {
                        frappe.call({
                    "method": "frappe.client.get",
                    args: {
                            doctype: "Sales Invoice", 
                            filters: {
                                name:["=", p.invoice_reference]
                            }
                        },
                    callback: function(data){
                            console.log(data);
                             frappe.model.set_value(d.doctype, d.name, "invoice_status",data.message.docstatus);
                             }
                         });

                }

});

frappe.ui.form.on("Sales Order", "work_site", function(frm) {
            var p = frm.doc;
                frappe.call({
                    "method": "frappe.client.get_list",
                    args: {
                            doctype: "Equipment",
                            fields: ["name","equipment_type","manufacturer","model"],     
                            filters: {
                                installed_at:["=", p.work_site]
                            }
                        },
                    callback: function(data){
                            console.log(data);
                            for(var i=0; i < data.message.length; i++){
                                    var nrow = frm.add_child("equipment_details");
                                    nrow.sl_no =data.message[i].name;
                                    nrow.unit_type =data.message[i].equipment_type;
                                    nrow.make =data.message[i].manufacturer;
                                    nrow.model_number =data.message[i].model;
                                    refresh_field("equipment_details")
                            }
                    }
                });
                frm.fields_dict.equipment_details.grid.get_field('sl_no').get_query =
                    function() {
                        return {
                            filters: {
                                "installed_at": p.work_site
                                        }
                        }
                    }
});

frappe.ui.form.on("Payment", "portion_percentage", function(frm, cdt, cdn) {
             var p = frm.doc;
            var d = locals[cdt][cdn];
                        if(p.including_tax==1)
                            {
                                var pv=p.base_grand_total*d.portion_percentage/100;
                            frappe.model.set_value(d.doctype, d.name, "portion_value",pv);
                            }
                         else
                             {
                                var pv=p.base_net_total*d.portion_percentage/100;
                             frappe.model.set_value(d.doctype, d.name, "portion_value",pv);
                             }
 });

frappe.ui.form.on("Payment", "create_auto_invoice", function(frm, cdt, cdn) {
        var p = frm.doc;
         var d = locals[cdt][cdn];
                if (d.create_auto_invoice==1)
                    {
                        frappe.model.set_value(d.doctype, d.name, "auto_invoice_generation_status","On");
                         frappe.model.set_value(d.doctype, d.name, "lead_days_to_invoice_creation",10);
                           var dt=frappe.datetime.add_days(d.planned_invoice_date, -d.lead_days_to_invoice_creation);  
                         frappe.model.set_value(d.doctype, d.name, "next_auto_invoice_date",dt);
                    }
                else
                    {
                       frappe.model.set_value(d.doctype, d.name, "auto_invoice_generation_status","");

                    }
});
frappe.ui.form.on("Payment", "lead_days_to_invoice_creation", function(frm, cdt, cdn) {
            var p = frm.doc;
            var d = locals[cdt][cdn];
               var dt=frappe.datetime.add_days(d.planned_invoice_date, -d.lead_days_to_invoice_creation);  
                frappe.model.set_value(d.doctype, d.name, "next_auto_invoice_date",dt);
                if(!d.lead_days_to_invoice_creation)
                {
                    frappe.model.set_value(d.doctype, d.name, "next_auto_invoice_date","");
                }
});

frappe.ui.form.on("Payment", "manual_invoicing", function(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
            
 });       
              

frappe.ui.form.on("Payment", "payment_add", function(frm, cdt, cdn) {  
               var p = frm.doc;
                var d = locals[cdt][cdn];
                frappe.call({
                        "method": "frappe.client.get_value",
                        args: {
                                doctype: "Customer",
                                fieldname: "payment_ageing_term_days",
                                filters: {
                                    customer_name:["=", p.customer]
                                }
                            },
                        callback: function(data){
                                console.log(data);
                               frappe.model.set_value(d.doctype, d.name, "payment_ageing_term_days",data.message.payment_ageing_term_days);
                        }
                    });
});       
     