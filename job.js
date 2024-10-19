frappe.ui.form.on("Job", "on_submit", function(frm, cdt, cdn){
	var p = frm.doc;
	var eqpmt=new Array();
	var pmt=new Array();
	for(var i=0; i < p.equipment_details.length; i++){
	eqpmt[0]={
		"customer_assets":p.equipment_details[i].customer_assets,
		"description":p.equipment_details[i].description,
		"qty":p.equipment_details[i].qty
	};
	}
	for(var i=0; i < p.payment_term_table.length; i++){
	pmt[0]={
		"payment_term":p.payment_term_table[i].payment_term,
		"description":p.payment_term_table[i].description,
		"due_date":p.payment_term_table[i].due_date,
		"invoice_portion":p.payment_term_table[i].invoice_portion,
		"payment_amount":p.payment_term_table[i].payment_amount
	};
	}
	console.log(pmt);
	var doc=frappe.model.get_new_doc("One time service");
	        doc.customer_name=p.person_name;
	        doc.address_1=p.address_line1;
	        doc.address_2=p.address_line2;
	        doc.city=p.city;
	        doc.qtn_date=p.date;
	        doc.quote_number=p.name;
	        doc.signature=p.signature;
	        doc.kind_attn=p.kind_attn;
	        doc.subject=p.subject;
	        doc.proposal_for=p.proposal_for;
	        doc.scope_of_work=p.scope_of_work;
	        doc.price_base=p.price_base;
	        doc.vat=p.vat;
	        doc.total=p.total;
	        doc.validity=p.validity;
	        doc.exclusions=p.exclusions;
	        doc.general_terms_and_conditions=p.general_terms_and_conditions;
	        doc.equipment_details=eqpmt;
	        doc.payment_terms=pmt;
        frappe.set_route("Form","One time service",doc.name);
     });

frappe.ui.form.on("Job Item", "item_code", function(frm, cdt, cdn){
        var p = frm.doc;	
         var d = locals[cdt][cdn];
         var bt=0;
        frappe.call({
						"method": "frappe.client.get",
						args: {
							doctype: "Item Price",							
							filters: {
								item_code:["=", d.item_code]
								}           			
							},
							async: false,								
							callback: function (data) {	
							console.log(data);				
							frappe.model.set_value(d.doctype, d.name, "quantity",1);	
							frappe.model.set_value(d.doctype, d.name, "rate",data.message.price_list_rate);	
							frappe.model.set_value(d.doctype, d.name, "amount",d.quantity*d.rate);
							for(var i = 0; i < p.item.length; i++){
								bt=bt+p.item[i].amount;
							}
							frappe.model.set_value(p.doctype, p.name, "base_total",bt);	
							frappe.model.set_value(p.doctype, p.name, "base_grand_total",bt);
							if(p.sales_taxes_and_charges){
						   		p.sales_taxes_and_charges.forEach(function(entry){
									entry.tax_amount=p.base_total*entry.rate/100
									frappe.model.set_value(p.doctype, p.name, "base_total_taxes_and_charges",entry.tax_amount);
									entry.total=entry.tax_amount+p.base_total
									frappe.model.set_value(p.doctype, p.name, "base_grand_total",entry.total);
								});
								refresh_field("sales_taxes_and_charges")
							}
						}
								
					})
    });

frappe.ui.form.on("Job Item", "quantity", function(frm, cdt, cdn){
        var p = frm.doc;	
         var d = locals[cdt][cdn];
       	var t=d.quantity*d.rate;
       	 var bt=0;
       	frappe.model.set_value(d.doctype, d.name, "amount",t);	
       	for(var i = 0; i < p.item.length; i++){
			bt=bt+p.item[i].amount;
			}
		frappe.model.set_value(p.doctype, p.name, "base_total",bt);	
		frappe.model.set_value(p.doctype, p.name, "base_grand_total",bt);
		if(p.sales_taxes_and_charges){
						   		p.sales_taxes_and_charges.forEach(function(entry){
									entry.tax_amount=p.base_total*entry.rate/100
									frappe.model.set_value(p.doctype, p.name, "base_total_taxes_and_charges",entry.tax_amount);
									entry.total=entry.tax_amount+p.base_total
									frappe.model.set_value(p.doctype, p.name, "base_grand_total",entry.total);
								});
								refresh_field("sales_taxes_and_charges")
						   	}					
    });

frappe.ui.form.on("Job", "taxes_and_charges", function(frm, cdt, cdn){
        var p = frm.doc;	
         var d = locals[cdt][cdn];
       frappe.call({
			"method": "frappe.client.get",
			args: {
					doctype: "Sales Taxes and Charges Template",
					filters: {
			  		name:["=", p.taxes_and_charges]
					}
				},
				async: false,
			callback: function(data){
					console.log(data);
					cur_frm.clear_table("sales_taxes_and_charges"); 
		for(var i=0; i < data.message.taxes.length; i++)
				{
				var nrow = frm.add_child("sales_taxes_and_charges");
                    nrow.charge_type =data.message.taxes[i].charge_type;
                    nrow.account_head =data.message.taxes[i].account_head;
                    nrow.rate =data.message.taxes[i].rate;
                    refresh_field("sales_taxes_and_charges")
				}	
				p.sales_taxes_and_charges.forEach(function(entry){
					entry.tax_amount=p.base_total*entry.rate/100
					frappe.model.set_value(p.doctype, p.name, "base_total_taxes_and_charges",entry.tax_amount);
					entry.total=entry.tax_amount+p.base_total
					frappe.model.set_value(p.doctype, p.name, "base_grand_total",entry.total);
				});
				refresh_field("sales_taxes_and_charges")
			}
		});
    });

frappe.ui.form.on('Job Item', {
   item_remove: function(frm) {
       var p = frm.doc;
        var bt=0;
        				for(var i = 0; i < p.item.length; i++){
								bt=bt+p.item[i].amount;
							}
							frappe.model.set_value(p.doctype, p.name, "base_total",bt);	
							frappe.model.set_value(p.doctype, p.name, "base_grand_total",bt);
							if(p.sales_taxes_and_charges){
						   		p.sales_taxes_and_charges.forEach(function(entry){
									entry.tax_amount=p.base_total*entry.rate/100
									frappe.model.set_value(p.doctype, p.name, "base_total_taxes_and_charges",entry.tax_amount);
									entry.total=entry.tax_amount+p.base_total
									frappe.model.set_value(p.doctype, p.name, "base_grand_total",entry.total);
								});
								refresh_field("sales_taxes_and_charges")
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
                                var pv=p.base_total*d.portion_percentage/100;
                             frappe.model.set_value(d.doctype, d.name, "portion_value",pv);
                             }
 });

frappe.ui.form.on("Job", "including_tax", function(frm, cdt, cdn) {
             var p = frm.doc;
            var d = locals[cdt][cdn];
                        if(p.including_tax==1){
                        p.payment_term_table.forEach(function(entry){
									entry.portion_value=p.base_grand_total*entry.portion_percentage/100
								});
								refresh_field("payment_term_table")
							}
							else{
								 p.payment_term_table.forEach(function(entry){
									entry.portion_value=p.base_total*entry.portion_percentage/100
								});
								refresh_field("payment_term_table")

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

frappe.ui.form.on("Job", "worksite", function(frm) {
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

frappe.ui.form.on("Job", "job_type", function(frm) {
    var p = frm.doc;
    if(p.job_type=="ONE TIME REPAIR")
    {
    frappe.model.set_value(p.doctype, p.name, "naming_series","RPR-");
    }
   	if(p.job_type=="One Time Service")
    {
    frappe.model.set_value(p.doctype, p.name, "naming_series","SO-");
    }
    if(p.job_type=="AMC")
    {
    frappe.model.set_value(p.doctype, p.name, "naming_series","CNT-");
    }
 });   

 frappe.ui.form.on('Payment', {
   payment_term_table_add: function(frm,cdt, cdn) {
       var p = frm.doc;
       var d = locals[cdt][cdn];
        var count=0;
        var dt;				

        					 if(p.including_tax==1)
                            {
                                var pv=p.base_grand_total*50/100;
                            frappe.model.set_value(d.doctype, d.name, "portion_value",pv);
                            }
                         else
                             {
                                var pv=p.base_total*50/100;
                             frappe.model.set_value(d.doctype, d.name, "portion_value",pv);
                             }
                              frappe.model.set_value(d.doctype, d.name, "portion_percentage",50);
        				for(var i = 1; i < p.payment_term_table.length; i++){
								count=count+1;
							}
							if(count==0)
							{
    						frappe.model.set_value(d.doctype, d.name, "payment_ageing_term_days","30");	
    						dt=frappe.datetime.add_days(p.date, 30);  
                         	frappe.model.set_value(d.doctype, d.name, "planned_invoice_date",dt);			
							}
							else
							{
							for(var i = 0; i < p.payment_term_table.length; i++){
							dt=frappe.datetime.add_days(p.payment_term_table[0].planned_invoice_date, 30);  
							}
							frappe.model.set_value(d.doctype, d.name, "payment_ageing_term_days","30");
                         	frappe.model.set_value(d.doctype, d.name, "planned_invoice_date",dt);
							}
 }
 }); 


 frappe.ui.form.on("Job", "after_save", function(frm, cdt, cdn){
	var p = frm.doc;

	  frappe.call({
                                        "method": "frappe.client.set_value",
                                        "args": {
                                            "doctype": "Lead",
                                            "name": p.lead,
                                            "fieldname":{
											"lead_name":p.person_name,
											"designation":p.designation,
											"company_name":p.organisation_name,
											"organization_type":p.organisation_type,
											"email_id":p.email_address,
											"gender":p.gender,
											"source":p.source,
											"customer_address_line1":p.address_line1,
											"customer_address_line2":p.address_line2,
											"city":p.city,
											"mobile_no":p.mobile_number,
											"office_phone_no":p.office_phone_no
                                            },
                                          }
                                    }); 
 }); 