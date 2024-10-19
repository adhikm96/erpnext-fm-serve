 hideTheButtonWrapper .find('.grid-add-row').hide();
        frappe.model.set_value(d.doctype, d.name, "portion_value", pv);