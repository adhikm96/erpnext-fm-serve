frappe.ui.form.on("Worksite", "refresh", function(frm, cdt, cdn){
	frm.add_custom_button(__('Create Equipment'), function() {4
		var p = frm.doc;
		  var doc = frappe.model.get_new_doc("Equipment");
		doc.installed_at=p.name;
   		 frappe.set_route("Form", "Equipment", doc.name);
	});
});