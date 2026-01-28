// Copyright (c) 2026, Publish and contributors
// For license information, please see license.txt

frappe.ui.form.on('EDO Document', {
	refresh: function(frm) {
		// Add "Apply Stamp" button if document has a PDF attachment
		if (frm.doc.main_document && frm.doc.main_document.toLowerCase().endsWith('.pdf')) {
			frm.add_custom_button(__('Добавить штамп'), function() {
				open_stamp_dialog(frm);
			}, __('Действия'));
		}
	}
});

function open_stamp_dialog(frm) {
	// First, get available stamps
	frappe.call({
		method: 'edo.edo.doctype.edo_document.edo_document.get_stamps',
		callback: function(r) {
			if (r.message && r.message.length > 0) {
				show_stamp_dialog(frm, r.message);
			} else {
				frappe.msgprint(__('Нет доступных штампов. Сначала создайте штамп в EDO Stamp.'));
			}
		}
	});
}

function show_stamp_dialog(frm, stamps) {
	// Get PDF info first
	frappe.call({
		method: 'edo.edo.doctype.edo_document.edo_document.get_pdf_info',
		args: {
			document_name: frm.doc.name
		},
		callback: function(r) {
			if (r.message) {
				create_stamp_dialog(frm, stamps, r.message);
			}
		}
	});
}

function create_stamp_dialog(frm, stamps, pdf_info) {
	// Create stamp options for select
	let stamp_options = stamps.map(s => ({
		label: s.title,
		value: s.name
	}));

	// Create page options
	let page_options = [];
	for (let i = 1; i <= pdf_info.page_count; i++) {
		page_options.push({
			label: `Страница ${i}`,
			value: i
		});
	}

	let selected_stamps = [];
	let current_stamp = null;

	let d = new frappe.ui.Dialog({
		title: __('Добавить штамп на PDF'),
		size: 'extra-large',
		fields: [
			{
				fieldname: 'stamps_section',
				fieldtype: 'Section Break',
				label: __('Настройки штампа')
			},
			{
				fieldname: 'stamp',
				fieldtype: 'Select',
				label: __('Выберите штамп'),
				options: stamp_options,
				reqd: 1,
				onchange: function() {
					let stamp_name = d.get_value('stamp');
					if (stamp_name) {
						// Show loading indicator
						d.fields_dict.stamp_preview.$wrapper.html(
							`<div style="text-align: center; padding: 10px;">
								<i class="fa fa-spinner fa-spin"></i> Загрузка превью...
							</div>`
						);

						// Get stamp preview with document data filled in
						frappe.call({
							method: 'edo.edo.doctype.edo_stamp.edo_stamp.get_stamp_preview',
							args: {
								stamp_name: stamp_name,
								document_name: frm.doc.name
							},
							callback: function(r) {
								if (r.message) {
									d.fields_dict.stamp_preview.$wrapper.html(
										`<div style="text-align: center; padding: 10px;">
											<img src="${r.message}" style="max-width: 200px; max-height: 100px; border: 1px solid #d1d8dd; border-radius: 4px;">
										</div>`
									);
								} else {
									// Fallback to original stamp image
									let stamp = stamps.find(s => s.name === stamp_name);
									if (stamp && stamp.stamp_image) {
										d.fields_dict.stamp_preview.$wrapper.html(
											`<div style="text-align: center; padding: 10px;">
												<img src="${stamp.stamp_image}" style="max-width: 200px; max-height: 100px; border: 1px solid #d1d8dd; border-radius: 4px;">
											</div>`
										);
									}
								}
							},
							error: function() {
								// Fallback to original stamp image on error
								let stamp = stamps.find(s => s.name === stamp_name);
								if (stamp && stamp.stamp_image) {
									d.fields_dict.stamp_preview.$wrapper.html(
										`<div style="text-align: center; padding: 10px;">
											<img src="${stamp.stamp_image}" style="max-width: 200px; max-height: 100px; border: 1px solid #d1d8dd; border-radius: 4px;">
										</div>`
									);
								}
							}
						});
					}
				}
			},
			{
				fieldname: 'stamp_preview',
				fieldtype: 'HTML',
				options: '<div style="text-align: center; padding: 10px; color: #8d99a6;">Выберите штамп для предпросмотра</div>'
			},
			{
				fieldname: 'col_break_1',
				fieldtype: 'Column Break'
			},
			{
				fieldname: 'page_number',
				fieldtype: 'Select',
				label: __('Страница'),
				options: page_options,
				default: 1,
				reqd: 1
			},
			{
				fieldname: 'position',
				fieldtype: 'Select',
				label: __('Позиция'),
				options: [
					{label: 'Верх-лево', value: 'top-left'},
					{label: 'Верх-центр', value: 'top-center'},
					{label: 'Верх-право', value: 'top-right'},
					{label: 'Центр', value: 'center'},
					{label: 'Низ-лево', value: 'bottom-left'},
					{label: 'Низ-центр', value: 'bottom-center'},
					{label: 'Низ-право', value: 'bottom-right'}
				],
				default: 'bottom-right',
				reqd: 1
			},
			{
				fieldname: 'scale',
				fieldtype: 'Float',
				label: __('Масштаб'),
				default: 1.0,
				description: __('Множитель размера (0.5 = 50%, 2.0 = 200%)')
			},
			{
				fieldname: 'stamps_list_section',
				fieldtype: 'Section Break',
				label: __('Добавленные штампы')
			},
			{
				fieldname: 'stamps_list',
				fieldtype: 'HTML',
				options: '<div id="stamps-list" style="min-height: 50px; padding: 10px; background: #f5f7fa; border-radius: 4px;"><em>Нет добавленных штампов</em></div>'
			}
		],
		primary_action_label: __('Применить штампы'),
		primary_action: function() {
			if (selected_stamps.length === 0) {
				frappe.msgprint(__('Добавьте хотя бы один штамп'));
				return;
			}

			// Prepare stamps data
			let stamps_data = selected_stamps.map(s => ({
				stamp_name: s.stamp,
				page_number: s.page_number - 1, // 0-indexed
				position: s.position,
				scale: s.scale
			}));

			frappe.call({
				method: 'edo.edo.doctype.edo_document.edo_document.apply_stamps_to_pdf',
				args: {
					document_name: frm.doc.name,
					stamps: JSON.stringify(stamps_data)
				},
				freeze: true,
				freeze_message: __('Применение штампов...'),
				callback: function(r) {
					if (r.message && r.message.success) {
						frappe.msgprint({
							title: __('Успешно'),
							indicator: 'green',
							message: r.message.message
						});
						d.hide();
						frm.reload_doc();
					}
				}
			});
		},
		secondary_action_label: __('Добавить штамп в список'),
		secondary_action: function() {
			let values = d.get_values();
			if (!values.stamp) {
				frappe.msgprint(__('Выберите штамп'));
				return;
			}

			let stamp = stamps.find(s => s.name === values.stamp);
			selected_stamps.push({
				stamp: values.stamp,
				stamp_title: stamp ? stamp.title : values.stamp,
				page_number: values.page_number,
				position: values.position,
				scale: values.scale || 1.0
			});

			update_stamps_list(d, selected_stamps);
		}
	});

	d.show();
}

function update_stamps_list(dialog, stamps) {
	let html = '';
	if (stamps.length === 0) {
		html = '<em>Нет добавленных штампов</em>';
	} else {
		html = '<table class="table table-bordered" style="margin-bottom: 0;">';
		html += '<thead><tr><th>Штамп</th><th>Страница</th><th>Позиция</th><th>Масштаб</th><th></th></tr></thead>';
		html += '<tbody>';
		stamps.forEach((s, idx) => {
			html += `<tr>
				<td>${s.stamp_title}</td>
				<td>${s.page_number}</td>
				<td>${get_position_label(s.position)}</td>
				<td>${s.scale}</td>
				<td><button class="btn btn-xs btn-danger" onclick="remove_stamp_from_list(${idx})">×</button></td>
			</tr>`;
		});
		html += '</tbody></table>';
	}
	dialog.fields_dict.stamps_list.$wrapper.find('#stamps-list').html(html);

	// Store stamps in dialog for access from remove function
	dialog._selected_stamps = stamps;
}

function get_position_label(position) {
	const labels = {
		'top-left': 'Верх-лево',
		'top-center': 'Верх-центр',
		'top-right': 'Верх-право',
		'center': 'Центр',
		'bottom-left': 'Низ-лево',
		'bottom-center': 'Низ-центр',
		'bottom-right': 'Низ-право'
	};
	return labels[position] || position;
}

// Global function for remove button
window.remove_stamp_from_list = function(idx) {
	let dialog = cur_dialog;
	if (dialog && dialog._selected_stamps) {
		dialog._selected_stamps.splice(idx, 1);
		update_stamps_list(dialog, dialog._selected_stamps);
	}
};
