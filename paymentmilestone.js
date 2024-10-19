frappe.ui.form.on("Milestones", "portion_percentage", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    var pp=0;
    var pv=0;
   var tx=0;
   if(p.taxes){
   for (var i = 0; i < p.taxes.length; i++) {
        tx=tx+p.taxes[i].tax_amount;
     }
     }
    var pv=(p.total_amount*d.portion_percentage)/100;
    frappe.model.set_value(d.doctype, d.name, "portion_value_with_tax", pv);
    frappe.model.set_value(d.doctype, d.name, "portion_value",(p.amount*d.portion_percentage)/100);
    frappe.model.set_value(d.doctype, d.name, "tax_value",(tx*d.portion_percentage)/100);

     for (var i = 0; i < p.milestones.length; i++) {
        pp=pp+p.milestones[i].portion_percentage;
     }
     if(pp>100){
        frappe.msgprint("The totalPortion Percentage can not be more than 100%");
        frappe.model.set_value(d.doctype, d.name, "portion_percentage", "");
        frappe.model.set_value(d.doctype, d.name, "portion_value_with_tax", "");
        frappe.model.set_value(d.doctype, d.name, "portion_value","");
     }
     else if(pp==100){
      hideTheButtonWrapper = $('*[data-fieldname="milestones"]');
        hideTheButtonWrapper .find('.grid-add-row').hide();
        frappe.model.set_value(d.doctype, d.name, "portion_value_with_tax", pv);
        frappe.model.set_value(d.doctype, d.name, "portion_value", (p.amount*d.portion_percentage)/100);
        frappe.model.set_value(d.doctype, d.name, "tax_value",(tx*d.portion_percentage)/100);
     }
     else{
        hideTheButtonWrapper = $('*[data-fieldname="milestones"]');
        hideTheButtonWrapper .find('.grid-add-row').show();
    frappe.model.set_value(d.doctype, d.name, "portion_value_with_tax", pv);
    frappe.model.set_value(d.doctype, d.name, "portion_value", (p.amount*d.portion_percentage)/100);
    frappe.model.set_value(d.doctype, d.name, "tax_value",(tx*d.portion_percentage)/100);
    }

});

frappe.ui.form.on("Payment Milestone", "before_save", function(frm) {
    var p = frm.doc;
    var pp=0;
     for (var i = 0; i < p.milestones.length; i++) {
        pp=pp+p.milestones[i].portion_percentage;
     }
     if(pp<100){
         frappe.msgprint("The total Portion Percentage is less than 100%");
     }
          
    });

frappe.ui.form.on("Payment Milestone", "after_save", function(frm) {     
   var p = frm.doc;
   var t_tax=0;
   for (var j = 0; j < p.taxes.length; j++){
             t_tax=t_tax+p.taxes[j].tax_amount;
        }
      frappe.call({
            "method": "fmserve.fm_serve.frappe_utilities.pay_ms_ref",
            args: {
                rname:p.item_number,
                pm_ref:p.name,
                tm:p.total_amount,
                tx:t_tax,
            },
            freeze:true,
            callback: function(data) {
            }
        });
      localStorage.setItem("pm",p.name);
          var jb = localStorage.getItem("back");
        if (jb){
            localStorage.removeItem("back");
            localStorage.setItem("reload_page","yes")
             frappe.set_route("Form", "Job",p.job);
        }
    });

    frappe.ui.form.on('Milestones', {
    milestones_add: function(frm, cdt, cdn) {
        var p = frm.doc;
        var d = locals[cdt][cdn];
         frappe.model.set_value(d.doctype, d.name, "job",p.job);
        frappe.model.set_value(d.doctype, d.name, "item_code",p.item_code);
        frappe.model.set_value(d.doctype, d.name, "qty",p.quantity);
        frappe.model.set_value(d.doctype, d.name, "customer",p.customer);
        frappe.model.set_value(d.doctype, d.name, "item_no",p.item_number);
        }

});

frappe.ui.form.on("Milestones", "planned_invoice_date", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    var dt = frappe.datetime.add_days(d.planned_invoice_date, -d.payment_ageing_term_days);
    frappe.model.set_value(d.doctype, d.name, "posting_date", dt);
});

frappe.ui.form.on("Payment Milestone", "taxes_and_charges_template", function(frm, cdt, cdn) {
    var p = frm.doc;
    var d = locals[cdt][cdn];
    var ta=0;
    var tac=0;
    frappe.call({
        "method": "frappe.client.get",
        args: {
            doctype: "Sales Taxes and Charges Template",
            filters: {
                name: ["=", p.taxes_and_charges_template]
            }
        },
        async: false,
        callback: function(data) {
            console.log(data);
            for (var i = 0; i < data.message.taxes.length; i++) {
                var nrow = frm.add_child("taxes");
                nrow.charge_type = data.message.taxes[i].charge_type;
                nrow.account_head = data.message.taxes[i].account_head;
                nrow.rate = data.message.taxes[i].rate;
            }
            p.taxes.forEach(function(entry) {
                entry.tax_amount = p.amount * entry.rate / 100
                entry.base_tax_amount=p.amount_company_currency*entry.rate / 100
            });
            frm.refresh_field("taxes")
        }
    });
if(p.taxes){
    for (var j = 0; j < p.taxes.length; j++) {
        ta+=p.taxes[j].tax_amount;
        tac+=p.taxes[j].base_tax_amount;
    }}
    frappe.model.set_value(p.doctype, p.name, "total_amount",ta+p.amount);
    frappe.model.set_value(p.doctype, p.name, "total_amount_company_currency",tac+p.amount_company_currency);
    p.milestones.forEach(function(entry) {
                entry.portion_value_with_tax = (p.total_amount*entry.portion_percentage)/100
                entry.portion_value=(p.amount*entry.portion_percentage)/100
                entry.tax_value=(ta*entry.portion_percentage)/100
            });
    frm.refresh_field("milestones")
});

frappe.ui.form.on("Payment Milestone", "generate__milestones", function(frm, cdt, cdn) {
    var p = frm.doc;
    var num=p.number_of_visits;
     p.milestones=[];
     var pp=100/num;
      var tx=0;
      if(p.taxes){
   for (var i = 0; i < p.taxes.length; i++) {
        tx=tx+p.taxes[i].tax_amount;
     }}
        for (var i = 0; i< num; i++) {
 var nrow = frm.add_child("milestones")   
        nrow.job=p.job;
        nrow.item_code=p.item_code;
        nrow.item_no=p.item_number;
        nrow.qty=p.quantity;
        nrow.customer=p.customer;
        nrow.portion_percentage=pp;
        nrow.portion_value_with_tax=(p.total_amount*pp)/100;
        nrow.portion_value=(p.amount*pp)/100
        nrow.tax_value=(tx*pp)/100
        }
        p.milestones[0].planned_invoice_date=p.contract_start_date
        for (var j = 1; j < p.milestones.length; j++){
             var ms_date=frappe.datetime.add_months(p.milestones[j-1].planned_invoice_date,p.frequency);
            p.milestones[j].planned_invoice_date = ms_date
        }
        
             frm.refresh_field("milestones")
              hideTheButtonWrapper = $('*[data-fieldname="milestones"]');
        hideTheButtonWrapper .find('.grid-add-row').hide();
});

frappe.ui.form.on('Milestones', {
    milestones_remove: function(frm, cdt, cdn) {
        var p = frm.doc;
        var pp=0;
        for (var i = 0; i < p.milestones.length; i++) {
        pp=pp+p.milestones[i].portion_percentage;
     }
        if(pp<100){
            hideTheButtonWrapper = $('*[data-fieldname="milestones"]');
        hideTheButtonWrapper .find('.grid-add-row').show();
        }
        }

});