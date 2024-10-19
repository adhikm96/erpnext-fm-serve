frappe.ui.form.on("Job Item", "item_code", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    var bt = 0;
    var tot=0;
    var tot_tax=0;
    var tot_am=0;
    frappe.call({
        "method": "frappe.client.get",
        args: {
            doctype: "Item Price",
            filters: {
                item_code: ["=", d.item_code]
            }
        },
        async: false,
        callback: function(data) {
            console.log(data);
            frappe.model.set_value(d.doctype, d.name, "quantity", 1);
            frappe.model.set_value(d.doctype, d.name, "rate", data.message.price_list_rate/p.exchange_rate);
            frappe.model.set_value(d.doctype, d.name, "amount", d.quantity * d.rate);
            frappe.model.set_value(d.doctype, d.name, "total_amount", d.amount);
            for (var i = 0; i < p.item.length; i++) {
                    tot += p.item[i].amount;
                    tot_tax+=p.item[i].tax_value;
                    tot_am+=p.item[i].total_amount;
                }

                frappe.model.set_value(p.doctype, p.name, "sum_of_job_value", tot);
                frappe.model.set_value(p.doctype, p.name, "total", tot*p.exchange_rate);
                frappe.model.set_value(p.doctype, p.name, "sum_of_taxes",tot_tax);
                frappe.model.set_value(p.doctype, p.name, "total_tax",tot_tax*p.exchange_rate);
                frappe.model.set_value(p.doctype, p.name, "sum_of_job_alues_with_taxes",tot_am);
                frappe.model.set_value(p.doctype, p.name, "total_with_tax",tot_am*p.exchange_rate);
        }

    })
});

frappe.ui.form.on("Job Item", "quantity", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    var t = d.quantity * d.rate;
    var tot=0;
    var tot_tax=0;
    var tot_am=0;
    frappe.model.set_value(d.doctype, d.name, "amount", t);
    frappe.model.set_value(d.doctype, d.name, "total_amount", t);
     for (var i = 0; i < p.item.length; i++) {
                    tot += p.item[i].amount;
                    tot_tax+=p.item[i].tax_value;
                    tot_am+=p.item[i].total_amount;
                }

                frappe.model.set_value(p.doctype, p.name, "sum_of_job_value", tot);
                frappe.model.set_value(p.doctype, p.name, "total", tot*p.exchange_rate);
                frappe.model.set_value(p.doctype, p.name, "sum_of_taxes",tot_tax);
                frappe.model.set_value(p.doctype, p.name, "total_tax",tot_tax*p.exchange_rate);
                frappe.model.set_value(p.doctype, p.name, "sum_of_job_alues_with_taxes",tot_am);
                frappe.model.set_value(p.doctype, p.name, "total_with_tax",tot_am*p.exchange_rate);
});

frappe.ui.form.on("Job", "worksite", function(frm) {
    var p = frm.doc;
    p.equipment_details = [];
    frappe.call({
        "method": "frappe.client.get_list",
        args: {
            doctype: "Equipment",
            fields: ["name", "equipment_type", "manufacturer", "model"],
            filters: {
                installed_at: ["=", p.worksite]
            }
        },
        callback: function(data) {
            console.log(data);
            for (var i = 0; i < data.message.length; i++) {
                var nrow = frm.add_child("equipment_details");
                nrow.sl_no = data.message[i].name;
                nrow.unit_type = data.message[i].equipment_type;
                nrow.make = data.message[i].manufacturer;
                nrow.model_number = data.message[i].model;
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
    if (p.job_type == "ONE TIME REPAIR") {
        frappe.model.set_value(p.doctype, p.name, "naming_series", "RPR-");
    }
    if (p.job_type == "One Time Service") {
        frappe.model.set_value(p.doctype, p.name, "naming_series", "SO-");
    }
    if (p.job_type == "AMC") {
        frappe.model.set_value(p.doctype, p.name, "naming_series", "CNT-");
    }
});

frappe.ui.form.on("Job Item", "milestone", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
cur_frm.save();
    frappe.call({
        "method": "frappe.client.get_list",
        args: {
            doctype: "Payment Milestone",
            fields: ["*"],
            filters: {
                job: ["=", p.name],
                item_code: ["=", d.item_code],
                item_number:["=", d.name]
            }
        },
        async: false,
        callback: function(data) {
            if (data.message) {
                localStorage.setItem("back", window.location.href);
                frappe.set_route("Form", "Payment Milestone", data.message[0].name);
            } else {
                localStorage.setItem("back", window.location.href);
                var doc = frappe.model.get_new_doc("Payment Milestone");
                doc.job = p.name;
                doc.item_code = d.item_code;
                doc.customer = p.customer;
                doc.amount = d.amount;
                doc.quantity = d.quantity;
                doc.item_number=d.name;
                doc.total_amount=d.amount;
                doc.currency=p.currency;
                doc.amount_company_currency=d.amount*p.exchange_rate;
                doc.total_amount_company_currency=d.amount*p.exchange_rate;
                frappe.set_route("Form", "Payment Milestone", doc.name);
            }
        }
    });
});


frappe.ui.form.on("Job", "refresh", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    var itm = new Array();
    var tot = 0;
    var mtot = 0;
    var tot_tax=0;
    var tot_am=0;
    var mtax=0;
    var mtota=0;

    if (p.workflow_state=="Job"){
    frm.set_df_property("lpo_number", "reqd", 1);
    frm.set_df_property("lpo_number", "hidden", 0);
    frm.set_df_property("lpo_date", "reqd", 1);
    frm.set_df_property("lpo_date", "hidden", 0);
    }

    refresh_field("item");
    var rp = localStorage.getItem("reload_page");
    if(rp=="yes"){
         localStorage.removeItem("reload_page");
         location.reload();
    }
     var p_m = localStorage.getItem("pm");
     if(p_m){
    frappe.call({
            "method": "fmserve.fm_serve.frappe_utilities.pm_save",
            args: {
                sodoc:p_m,
            },
            callback: function(data) {
                localStorage.removeItem("pm");
            }
        });
}

    for (var i = 0; i < p.item.length; i++) {
        tot += p.item[i].amount;
         tot_tax+=p.item[i].tax_value;
                    tot_am+=p.item[i].total_amount;
    }

    frappe.model.set_value(p.doctype, p.name, "sum_of_job_value", tot);
    frappe.model.set_value(p.doctype, p.name, "total", tot*p.exchange_rate);
     frappe.model.set_value(p.doctype, p.name, "sum_of_taxes",tot_tax);
                frappe.model.set_value(p.doctype, p.name, "total_tax",tot_tax*p.exchange_rate);
                frappe.model.set_value(p.doctype, p.name, "sum_of_job_alues_with_taxes",tot_am);
                frappe.model.set_value(p.doctype, p.name, "total_with_tax",tot_am*p.exchange_rate);

    frappe.model.set_value(p.doctype, p.name, "select_item", "");
    for (var i = 0; i < p.item.length; i++) {
        itm[i] =[i+1]+"-"+ p.item[i].item_code;
    }
    frm.set_df_property('select_item', 'options', itm);

    frappe.call({
        "method": "fmserve.fm_serve.frappe_utilities.bring_milestones",
        args: {
            sodoc: p.name,
        },
        callback: function(data) {
            console.log(data);
            if(data.message){
            for (var i = 0; i < data.message.length; i++){
                var test=0;
                for(var j = 0; j < p.item.length; j++){
                    if(data.message[i].item_no==p.item[j].name)
                    {
                       test=1;
                    }
                }
                if(test!=1){
                    frappe.call({
                            "method": "fmserve.fm_serve.frappe_utilities.del_doc",
                            args: {
                                pmn:data.message[i].payment_milestone,
                            },
                            callback: function(data) {
                                console.log(data);
                                location.reload();
                            }
                        });
                    
                }
            }


            localStorage.setItem("milestone_data", JSON.stringify(data.message));
            html = "<table class='table'><tr><th>Item Code</th><th>Item Discrip.</th><th>Portion Per.</th><th>Portion Value</th><th>Tax Value</th><th>Portion Value with Tax</th><th>Invoice ref.</th><th>Milestone Ref.</th><th>Invoice Status</th></tr>";
            for (var i = 0; i < data.message.length; i++) {
                mtot += data.message[i].portion_value;
                mtax+=data.message[i].tax_value;
                mtota+=data.message[i].portion_value_with_tax;
                var btn_s="<button type='button' class='btn btn-default btn-xs input-sm siButton'>Create Invoice</button>";
                if(data.message[i].invoice_reference){
                    btn_s="<a class='btn-default btn-xs' href='/desk#Form/Sales%20Invoice/" + data.message[i].invoice_reference + "'>" + data.message[i].invoice_reference + "</a>";
                }
                html += "<tr id=" + data.message[i].name + "><td>" + data.message[i].item_code + "</td>\
                                        <td>" + data.message[i].item_desciption + "</td>\
                                        <td>" + data.message[i].portion_percentage + "%</td>\
                                        <td>" + data.message[i].portion_value.toFixed(2) + "</td>\
                                        <td>" + data.message[i].tax_value.toFixed(2) + "</td>\
                                        <td>" + data.message[i].portion_value_with_tax.toFixed(2) + "</td>\
                                        <td>"+btn_s+"</td>\
                                        <td><a href='/desk#Form/Payment%20Milestone/" + data.message[i].payment_milestone+ "'>" + data.message[i].payment_milestone + "</a></td>\
                                        <td>" + data.message[i].invoice_status + "</td>\
                                        </tr>";
            }

            html += "<tr><th colspan='3'>Sum of Milestone value</th><th>" + mtot.toFixed(2) + "</th><th>" + mtax.toFixed(2) + "</th><th>" + mtota.toFixed(2) + "</th><th colspan='3'></th></tr></table>";
            $(frm.fields_dict['milestones'].wrapper).html(html);
        }
    }
    });
});

$(document).on("click", ".siButton", function(event,frm) {
    var rowid = event.target.parentNode.parentNode.id || "";
    if (rowid) {
        if(cur_frm.doc.workflow_state=="Job"){
        frappe.call({
            "method": "fmserve.fm_serve.frappe_utilities.create_manual_invoice",
            args: {
                sodoc: rowid,
                lpo_n:cur_frm.doc.lpo_number,
                lpo_d:cur_frm.doc.lpo_date,
            },
            callback: function(data) {
                
                location.reload();
                console.log(data);
            }
        });
        }
        else{
            frappe.msgprint("Please process the Quote into Job");
        }
    }
});

frappe.ui.form.on("Job", "select_item", function(frm, cdt, cdn) {
    var p = frm.doc;
    var m = JSON.parse(localStorage.getItem("milestone_data"));
    var mtot = 0
    var mtax=0;
    var mtota=0;
    html = "<table class='table'><tr><th>Item Code</th><th>Item Discrip.</th><th>Portion Per.</th><th>Portion Value</th><th>Tax Value</th><th>Portion Value with Tax</th><th>Invoice ref.</th><th>Milestone Ref.</th><th>Invoice Status</th></tr>";
   var n=p.select_item.substring(0,p.select_item.indexOf("-"));
    for (var i = 0; i < m.length; i++) {
    if(p.item[n-1].name==m[i].item_no){
            mtot += m[i].portion_value;
            mtax += m[i].tax_value;
            mtota += m[i].portion_value_with_tax;
              var btn_s="<button type='button' class='btn btn-default btn-xs input-sm siButton'>Create Invoice</button>";
                if(m[i].invoice_reference){
                    btn_s="<a class='btn-default btn-xs' href='/desk#Form/Sales%20Invoice/" + m[i].invoice_reference + "'>" + m[i].invoice_reference + "</a>";
                }
            html += "<tr id=" + m[i].name + "><td>" + m[i].item_code + "</td>\
                                        <td>" + m[i].item_desciption + "</td>\
                                        <td>" + m[i].portion_percentage + "%</td>\
                                        <td>" + m[i].portion_value.toFixed(2) + "</td>\
                                        <td>" + m[i].tax_value.toFixed(2) + "</td>\
                                        <td>" + m[i].portion_value_with_tax.toFixed(2) + "</td>\
                                       <td>"+btn_s+"</td>\
                                       <td><a href='/desk#Form/Payment%20Milestone/" + m[i].payment_milestone+ "'>" + m[i].payment_milestone + "</a></td>\
                                        <td>" + m[i].invoice_status + "</td>\
                                        </tr>";
        }
    }
    html += "<tr><th colspan='3'>Sum of Milestone value</th><th>" + mtot.toFixed(2) + "</th><th>" + mtax.toFixed(2) + "</th><th>" + mtota.toFixed(2) + "</th><th colspan='3'></th></tr></table>";
    $(frm.fields_dict['milestones'].wrapper).html(html);
});



frappe.ui.form.on('Job Item', {
           item_remove: function(frm, cdt, cdn) {
                var p = frm.doc;
                var d = locals[cdt][cdn];
                var tot=0;
                var tot_tax=0;
    var tot_am=0;
                for (var i = 0; i < p.item.length; i++) {
                    tot += p.item[i].amount;
                     tot_tax+=p.item[i].tax_value;
                    tot_am+=p.item[i].total_amount;
                }

                frappe.model.set_value(p.doctype, p.name, "sum_of_job_value", tot);
                frappe.model.set_value(p.doctype, p.name, "total", tot*p.exchange_rate);
                 frappe.model.set_value(p.doctype, p.name, "sum_of_taxes",tot_tax);
                frappe.model.set_value(p.doctype, p.name, "total_tax",tot_tax*p.exchange_rate);
                frappe.model.set_value(p.doctype, p.name, "sum_of_job_alues_with_taxes",tot_am);
                frappe.model.set_value(p.doctype, p.name, "total_with_tax",tot_am*p.exchange_rate);
            }
        });

frappe.ui.form.on("Job", "customer", function(frm, cdt, cdn) {
    var p = frm.doc;

    cur_frm.fields_dict['worksite'].get_query = function(doc) {
    return {
        filters: {
            "customer": p.customer
        }
    }
}

    frappe.call({
                method: 'frappe.contacts.doctype.address.address.get_default_address',
                args: {
                    "doctype": "Customer", "name":p.customer
                },
                callback: function(r) {
                    console.log(r.message);
                     frappe.model.set_value(p.doctype, p.name, "c_address",r.message);
                }
            });
    frappe.call({
                method: 'frappe.contacts.doctype.contact.contact.get_default_contact',
                args: {
                    "doctype": "Customer", "name": p.customer
                },
                ignore_permissions: true,
                callback: function(r) {
                    console.log(r.message);
                    frappe.model.set_value(p.doctype, p.name, "contact_number",r.message);
                }
            });
});

frappe.ui.form.on("Job", "c_address", function(frm, cdt, cdn) {
    var p = frm.doc;
    
    frappe.call({
                method: 'frappe.contacts.doctype.address.address.get_address_display',
                args: {
                    "address_dict": p.c_address || ""
                },
                callback: function(r) {
                    console.log(r.message);
                    frappe.model.set_value(p.doctype, p.name, "address_display",r.message);
                }
            });
    
});

frappe.ui.form.on("Job", "contact_number", function(frm, cdt, cdn) {
    var p = frm.doc;
    
frappe.call({
                method: 'frappe.contacts.doctype.contact.contact.get_contact_details',
                args: {
                    "contact":p.contact_number || ""
                },
                callback: function(r) {
                    console.log(r.message);
                    frappe.model.set_value(p.doctype, p.name, "email",r.message.contact_email);
                    frappe.model.set_value(p.doctype, p.name, "mobile_number",r.message.contact_number);
                }
            });
   
});

frappe.ui.form.on("Job", "currency", function(frm, cdt, cdn) {
    var p = frm.doc;
    var tot=0;
    var tot_tax=0;
    var tot_am=0;
    frappe.call({
    method:"frappe.client.get_value",
    args: {
        doctype:"Currency Exchange",
        filters: {
            from_currency:p.currency,
        },
        fieldname:["exchange_rate"]
    }, 
    callback: function(r) { 
        console.log(r);
        cur_frm.set_value("exchange_rate", r.message.exchange_rate);
    }   
})
     frm.set_df_property("exchange_rate", "description","1"+p.currency+"=[?]AED");
     if(p.currency=="AED"){
         cur_frm.set_value("exchange_rate", 1);
          frappe.call({
        "method": "frappe.client.get_list",
        args: {
            doctype: "Item Price",
            fields:["price_list_rate","item_code"],
            filters: {
            }
        },
        async: false,
        callback: function(data) {
           p.item.forEach(function(entry) {
                    for (var i = 0; i <data.message.length; i++){
                        if(data.message[i].item_code==entry.item_code){
                            entry.rate=data.message[i].price_list_rate;
                        entry.amount=entry.rate*entry.quantity;
                        }
                    }
                        
                    });
      frm.refresh_field("item");
      for (var i = 0; i < p.item.length; i++) {
                    tot += p.item[i].amount;
                     tot_tax+=p.item[i].tax_value;
                    tot_am+=p.item[i].total_amount;
                }

                frappe.model.set_value(p.doctype, p.name, "sum_of_job_value", tot);
      frappe.model.set_value(p.doctype, p.name, "total",tot);
       frappe.model.set_value(p.doctype, p.name, "sum_of_taxes",tot_tax);
                frappe.model.set_value(p.doctype, p.name, "total_tax",tot_tax*p.exchange_rate);
                frappe.model.set_value(p.doctype, p.name, "sum_of_job_alues_with_taxes",tot_am);
                frappe.model.set_value(p.doctype, p.name, "total_with_tax",tot_am*p.exchange_rate);
        }
    });
     }
});
frappe.ui.form.on("Job", "exchange_rate", function(frm, cdt, cdn) {
    var p = frm.doc;
    var tot=0;
    var tot_tax=0;
    var tot_am=0;
    var ex=p.exchange_rate;
       p.item.forEach(function(entry) {
                        entry.rate=entry.rate/ex;
                        entry.amount=entry.rate*entry.quantity;
                    });
      frm.refresh_field("item");
      for (var i = 0; i < p.item.length; i++) {
                    tot += p.item[i].amount;
                     tot_tax+=p.item[i].tax_value;
                    tot_am+=p.item[i].total_amount;
                }

                frappe.model.set_value(p.doctype, p.name, "sum_of_job_value", tot);
      frappe.model.set_value(p.doctype, p.name, "total",p.sum_of_job_value/ex);
       frappe.model.set_value(p.doctype, p.name, "sum_of_taxes",tot_tax);
                frappe.model.set_value(p.doctype, p.name, "total_tax",tot_tax*p.exchange_rate);
                frappe.model.set_value(p.doctype, p.name, "sum_of_job_alues_with_taxes",tot_am);
                frappe.model.set_value(p.doctype, p.name, "total_with_tax",tot_am*p.exchange_rate);
});