# -*- coding: utf-8 -*-
# Copyright (c) 2018, Yumatrix Enterprise Solutions LLC and contributors
# For license information, please see license.txt
import frappe
import re
from frappe import _
from frappe.utils import (flt, getdate, get_first_day, get_last_day, date_diff,
	add_months, add_days, formatdate, cint)

@frappe.whitelist()
def create_scheduled_invoices():
	dt=getdate()
	for i in frappe.db.get_list("Sales Order"):
		so = frappe.get_doc("Sales Order", i.name)
		if so.docstatus	== 1:
			for f in so.payment:
				if f.next_auto_invoice_date==dt:
					if f.create_auto_invoice==1 and not f.invoice_reference:
						# sales_invoice = frappe.new_doc("Sales Invoice")
						# sales_invoice.customer=pymt.customer
						# sales_invoice.posting_date=f.next_auto_invoice_date
						# sales_invoice.due_date=f.planned_invoice_date
						# itm=[]
						# for f in pymt.payment:
						# 	item.append(f.)
						# sales_invoice.items=itm
						# sales_invoice.save()
						# frappe.db.commit()
						pd = f.next_auto_invoice_date
						from erpnext.selling.doctype.sales_order.sales_order import make_sales_invoice        
						si = make_sales_invoice(so.name)
						si.set_posting_time = 1
						si.posting_date = pd
						si.due_date=f.planned_invoice_date
						for i in si.items:
							i.rate=i.rate*f.portion_percentage/100
						res = si.insert()
						si.submit()	               
						frappe.db.set_value("Payment",f.name, "invoice_reference", res.name) 
						frappe.db.set_value("Payment",f.name, "invoice_status", res.status)  
						frappe.db.commit()          
						#frappe.msgprint("Sales Invoice is created");
	return "Success"

@frappe.whitelist()
def create_manual_invoice(sodoc, sopaydoc):
	so = frappe.get_doc("Sales Order", sodoc)
	if so.docstatus	== 1:
		for f in so.payment:
			if f.name==sopaydoc:
				if not f.invoice_reference:
					pd = f.next_auto_invoice_date
					from erpnext.selling.doctype.sales_order.sales_order import make_sales_invoice        
					si = make_sales_invoice(so.name)
					si.set_posting_time = 1
					si.posting_date = pd
					si.due_date=f.planned_invoice_date
					for i in si.items:
						i.amount=i.amount*f.portion_percentage%
					res = si.insert()
					si.submit()	               
					frappe.db.set_value("Payment",f.name, "invoice_reference", res.name) 
					frappe.db.set_value("Payment",f.name, "invoice_status", res.status)  
					frappe.db.commit()          
					frappe.msgprint("Sales Invoice is created");
						


			






