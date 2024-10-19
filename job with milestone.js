frappe.ui.form.on("Job Item", "item_code", function(frm, cdt, cdn) {
    var p = frm.doc;


    var bt = 0;
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
            frappe.model.set_value(d.doctype, d.name, "rate", data.message.price_list_rate);
            frappe.model.set_value(d.doctype, d.name, "amount", d.quantity * d.rate);
            for (var i = 0; i < p.item.length; i++) {
                bt = bt + p.item[i].amount;
            }
            frappe.model.set_value(p.doctype, p.name, "base_total", bt);
            frappe.model.set_value(p.doctype, p.name, "base_grand_total", bt);
            if (p.sales_taxes_and_charges) {
                p.sales_taxes_and_charges.forEach(function(entry) {
                    entry.tax_amount = p.base_total * entry.rate / 100
                    frappe.model.set_value(p.doctype, p.name, "base_total_taxes_and_charges", entry.tax_amount);
                    entry.total = entry.tax_amount + p.base_total
                    frappe.model.set_value(p.doctype, p.name, "base_grand_total", entry.total);
                });
                refresh_field("sales_taxes_and_charges")
            }
        }

    })
});

frappe.ui.form.on("Job Item", "quantity", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    var t = d.quantity * d.rate;
    var bt = 0;
    frappe.model.set_value(d.doctype, d.name, "amount", t);
    for (var i = 0; i < p.item.length; i++) {
        bt = bt + p.item[i].amount;
    }
    frappe.model.set_value(p.doctype, p.name, "base_total", bt);
    frappe.model.set_value(p.doctype, p.name, "base_grand_total", bt);
    if (p.sales_taxes_and_charges) {
        p.sales_taxes_and_charges.forEach(function(entry) {
            entry.tax_amount = p.base_total * entry.rate / 100
            frappe.model.set_value(p.doctype, p.name, "base_total_taxes_and_charges", entry.tax_amount);
            entry.total = entry.tax_amount + p.base_total
            frappe.model.set_value(p.doctype, p.name, "base_grand_total", entry.total);
        });
        refresh_field("sales_taxes_and_charges")
    }
});

frappe.ui.form.on("Job", "taxes_and_charges", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    frappe.call({
        "method": "frappe.client.get",
        args: {
            doctype: "Sales Taxes and Charges Template",
            filters: {
                name: ["=", p.taxes_and_charges]
            }
        },
        async: false,
        callback: function(data) {
            console.log(data);
            cur_frm.clear_table("sales_taxes_and_charges");
            for (var i = 0; i < data.message.taxes.length; i++) {
                var nrow = frm.add_child("sales_taxes_and_charges");
                nrow.charge_type = data.message.taxes[i].charge_type;
                nrow.account_head = data.message.taxes[i].account_head;
                nrow.rate = data.message.taxes[i].rate;
                refresh_field("sales_taxes_and_charges")
            }
            p.sales_taxes_and_charges.forEach(function(entry) {
                entry.tax_amount = p.base_total * entry.rate / 100
                frappe.model.set_value(p.doctype, p.name, "base_total_taxes_and_charges", entry.tax_amount);
                entry.total = entry.tax_amount + p.base_total
                frappe.model.set_value(p.doctype, p.name, "base_grand_total", entry.total);
            });
            refresh_field("sales_taxes_and_charges")
        }
    });
});

frappe.ui.form.on('Job Item', {
    item_remove: function(frm) {
        var p = frm.doc;
        var bt = 0;
        for (var i = 0; i < p.item.length; i++) {
            bt = bt + p.item[i].amount;
        }
        frappe.model.set_value(p.doctype, p.name, "base_total", bt);
        frappe.model.set_value(p.doctype, p.name, "base_grand_total", bt);
        if (p.sales_taxes_and_charges) {
            p.sales_taxes_and_charges.forEach(function(entry) {
                entry.tax_amount = p.base_total * entry.rate / 100
                frappe.model.set_value(p.doctype, p.name, "base_total_taxes_and_charges", entry.tax_amount);
                entry.total = entry.tax_amount + p.base_total
                frappe.model.set_value(p.doctype, p.name, "base_grand_total", entry.total);
            });
            refresh_field("sales_taxes_and_charges")
        }
    }
});

frappe.ui.form.on("Payment", "portion_percentage", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    if (p.including_tax == 1) {
        var pv = p.base_grand_total * d.portion_percentage / 100;
        frappe.model.set_value(d.doctype, d.name, "portion_value", pv);
    } else {
        var pv = p.base_total * d.portion_percentage / 100;
        frappe.model.set_value(d.doctype, d.name, "portion_value", pv);
    }
});

frappe.ui.form.on("Job", "including_tax", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    if (p.including_tax == 1) {
        p.payment_term_table.forEach(function(entry) {
            entry.portion_value = p.base_grand_total * entry.portion_percentage / 100
        });
        refresh_field("payment_term_table")
    } else {
        p.payment_term_table.forEach(function(entry) {
            entry.portion_value = p.base_total * entry.portion_percentage / 100
        });
        refresh_field("payment_term_table")

    }
});

frappe.ui.form.on("Payment", "create_auto_invoice", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    if (d.create_auto_invoice == 1) {
        frappe.model.set_value(d.doctype, d.name, "auto_invoice_generation_status", "On");
        frappe.model.set_value(d.doctype, d.name, "lead_days_to_invoice_creation", 10);
        var dt = frappe.datetime.add_days(d.planned_invoice_date, -d.lead_days_to_invoice_creation);
        frappe.model.set_value(d.doctype, d.name, "next_auto_invoice_date", dt);
    } else {
        frappe.model.set_value(d.doctype, d.name, "auto_invoice_generation_status", "");

    }
});

frappe.ui.form.on("Payment", "lead_days_to_invoice_creation", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    var dt = frappe.datetime.add_days(d.planned_invoice_date, -d.lead_days_to_invoice_creation);
    frappe.model.set_value(d.doctype, d.name, "next_auto_invoice_date", dt);
    if (!d.lead_days_to_invoice_creation) {
        frappe.model.set_value(d.doctype, d.name, "next_auto_invoice_date", "");
    }
});

frappe.ui.form.on("Job", "worksite", function(frm) {
    var p = frm.doc;
    frappe.call({
        "method": "frappe.client.get_list",
        args: {
            doctype: "Equipment",
            fields: ["name", "equipment_type", "manufacturer", "model"],
            filters: {
                installed_at: ["=", p.work_site]
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

frappe.ui.form.on('Payment', {
    payment_term_table_add: function(frm, cdt, cdn) {
        var p = frm.doc;
        var d = locals[cdt][cdn];
        var count = 0;
        var dt;
       
        frappe.model.set_value(d.doctype, d.name, "item_code",p.item_code);

        if (p.including_tax == 1) {
            var pv = p.base_grand_total * 50 / 100;
            frappe.model.set_value(d.doctype, d.name, "portion_value", pv);
        } else {
            var pv = p.base_total * 50 / 100;
            frappe.model.set_value(d.doctype, d.name, "portion_value", pv);
        }
        frappe.model.set_value(d.doctype, d.name, "portion_percentage", 50);
        for (var i = 1; i < p.payment_term_table.length; i++) {
            count = count + 1;
        }
        if (count == 0) {
            frappe.model.set_value(d.doctype, d.name, "payment_ageing_term_days", "30");
            dt = frappe.datetime.add_days(p.date, 30);
            frappe.model.set_value(d.doctype, d.name, "planned_invoice_date", dt);
        } else {
            for (var i = 0; i < p.payment_term_table.length; i++) {
                dt = frappe.datetime.add_days(p.payment_term_table[0].planned_invoice_date, 30);
            }
            frappe.model.set_value(d.doctype, d.name, "payment_ageing_term_days", "30");
            frappe.model.set_value(d.doctype, d.name, "planned_invoice_date", dt);
        }
    }
});

frappe.ui.form.on("Job", "refresh", function(frm) {
    var p = frm.doc;
    console.log(p.workflow_state); 
   

    if (p.workflow_state == "Job  Lost") {
        frm.set_df_property("competeitor_name", "reqd", 1);
        frm.set_df_property("competeitor_name", "hidden", 0);
        frm.set_df_property("price_detail", "reqd", 1);
        frm.set_df_property("price_detail", "hidden", 0);
        frm.set_df_property("award_date", "reqd", 1);
        frm.set_df_property("award_date", "hidden", 0);
        frm.set_df_property("other_details_any", "reqd", 1);
        frm.set_df_property("other_details_any", "hidden", 0);
    }

    if (p.workflow_state == "Assigned to Convertor") {
        frm.set_df_property("customer_po_number", "reqd", 1);
        frm.set_df_property("customer_po_number", "hidden", 0);
        frm.set_df_property("po_date", "reqd", 1);
        frm.set_df_property("po_date", "hidden", 0);
        frm.set_df_property("payment_plan", "reqd", 1);
        frm.set_df_property("payment_plan", "hidden", 0);
        frm.set_df_property("budgeted_cost", "reqd", 1);
        frm.set_df_property("budgeted_cost", "hidden", 0);
        frm.set_df_property("delivery_note", "hidden", 0);
    }
    if (p.workflow_state == "Job Won") {
        frm.set_df_property("delivery_note", "hidden", 0);
    }
    if (p.workflow_state == "Processing") {
        frm.set_df_property("delivery_note", "hidden", 0);
    }
    if (p.workflow_state == "Completed") {
        frm.set_df_property("delivery_note", "hidden", 0);
    }

    var ic = new Array();
    frappe.model.set_value(p.doctype, p.name, "item_code","");
    for(var i=0; i < p.item.length; i++){
     ic[i]=p.item[i].item_code;
    }
     frm.set_df_property('item_code', 'options',ic);
     frm.refresh_field('item_code');
});

frappe.ui.form.on("Job", "delivery_note", function(frm) {
    var p = frm.doc;
    var doc = frappe.model.get_new_doc("Delivery Note");
    frappe.set_route("Form", "Delivery Note", doc.name);
});
frappe.ui.form.on("Payment", "create_manual_invoice", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];

    frappe.call({
        "method": "frappe.client.get_list",
        args: {
            doctype: "Customer",
            filters: {
                name: ["=", p.organisation_name]
            }
        },
        async: false,
        callback: function(data) {
            if (data.message) {
                console.log(data);
                   frappe.call({
                            "method": "fmserve.fm_serve.frappe_utilities.job_create_manual_invoice1",
                            args: {
                                sodoc: p.name,
                                sopaydoc:d.name
                            },
                            callback: function(data) {
                                console.log(data);
                                location.reload();

                    }
                });

            } else {
                frappe.call({
                    "method": "fmserve.fm_serve.frappe_utilities.create_customer",
                    args: {
                        sodoc: p.lead,
                    },
                    callback: function(data) {
                        console.log(data);
                        frappe.call({
                            "method": "fmserve.fm_serve.frappe_utilities.job_create_manual_invoice1",
                            args: {
                                sodoc: p.name,
                                sopaydoc:d.name
                            },
                            callback: function(data) {
                                console.log(data);
                                location.reload();

                    }
                });

                    }
                });

            }

        }
    })

});


frappe.ui.form.on("Job Item", "item_code", function(frm) {
    var p = frm.doc;
    var ic = new Array();
    frappe.model.set_value(p.doctype, p.name, "item_code","");
    for(var i=0; i < p.item.length; i++){
     ic[i]=p.item[i].item_code;
    }
     frm.set_df_property('item_code', 'options',ic);
     frm.refresh_field('item_code');
});

