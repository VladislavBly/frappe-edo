frappe.ui.form.on('EDO Stamp', {
	refresh: function(frm) {
		// Загружаем список полей документа для field_mappings
		load_document_fields(frm);
		
		// Обновляем превью при загрузке формы
		update_stamp_preview(frm);
	},
	
	stamp_image: function(frm) {
		// Обновляем превью при изменении изображения
		update_stamp_preview(frm);
	},
	
	field_mappings_add: function(frm, cdt, cdn) {
		// При добавлении новой строки обновляем опции
		setTimeout(function() {
			update_field_options_in_row(frm, cdt, cdn);
			update_stamp_preview(frm);
		}, 200);
	},
	
	field_mappings_remove: function(frm) {
		// При удалении строки обновляем превью
		update_stamp_preview(frm);
	}
});

frappe.ui.form.on('EDO Stamp Field Mapping', {
	form_render: function(frm, cdt, cdn) {
		// При рендеринге формы строки обновляем опции
		update_field_options_in_row(frm, cdt, cdn);
	},
	
	document_field: function(frm, cdt, cdn) {
		// При изменении поля обновляем превью
		update_stamp_preview(frm);
	},
	
	position_x: function(frm, cdt, cdn) {
		update_stamp_preview(frm);
	},
	
	position_y: function(frm, cdt, cdn) {
		update_stamp_preview(frm);
	},
	
	font_size: function(frm, cdt, cdn) {
		update_stamp_preview(frm);
	},
	
	color: function(frm, cdt, cdn) {
		update_stamp_preview(frm);
	},

	max_width: function(frm, cdt, cdn) {
		update_stamp_preview(frm);
	}
});

function update_field_options_in_row(frm, cdt, cdn) {
	if (!frm._document_fields_options) {
		// Если опции еще не загружены, загружаем их
		load_document_fields(frm, function() {
			update_field_options_in_row(frm, cdt, cdn);
		});
		return;
	}
	
	let options = frm._document_fields_options;
	
	// Используем set_df_property для установки опций в child table
	try {
		frm.set_df_property('document_field', 'options', options, cdn, 'field_mappings');
	} catch(e) {
		console.error('Error setting field options:', e);
		// Альтернативный способ через прямое обращение к полю
		setTimeout(function() {
			let grid = frm.fields_dict.field_mappings.grid;
			if (grid) {
				let row = grid.grid_rows.find(r => r.doc && r.doc.name === cdn);
				if (row && row.grid_form && row.grid_form.fields_dict && row.grid_form.fields_dict.document_field) {
					let field = row.grid_form.fields_dict.document_field;
					field.df.options = options;
					if (field.refresh) {
						field.refresh();
					} else if (field.make) {
						field.make();
					}
				}
			}
		}, 100);
	}
}

function load_document_fields(frm, callback) {
	if (frm._document_fields_loading) {
		if (callback) {
			// Ждем завершения текущей загрузки
			let checkInterval = setInterval(function() {
				if (!frm._document_fields_loading && frm._document_fields_options) {
					clearInterval(checkInterval);
					callback();
				}
			}, 100);
		}
		return;
	}
	
	frm._document_fields_loading = true;
	
	frappe.call({
		method: 'edo.edo.doctype.edo_stamp.edo_stamp.get_document_fields',
		callback: function(r) {
			frm._document_fields_loading = false;
			
			if (r.message && r.message.length > 0) {
				let options = r.message.join('\n');
				frm._document_fields_options = options;
				
				// Обновляем метаданные для будущих строк
				frappe.model.with_doctype('EDO Stamp Field Mapping', function() {
					let df = frappe.meta.get_docfield('EDO Stamp Field Mapping', 'document_field');
					if (df) {
						df.options = options;
					}
					
					if (!frappe.meta.docfield_map['EDO Stamp Field Mapping']) {
						frappe.meta.docfield_map['EDO Stamp Field Mapping'] = {};
					}
					if (!frappe.meta.docfield_map['EDO Stamp Field Mapping']['document_field']) {
						frappe.meta.docfield_map['EDO Stamp Field Mapping']['document_field'] = df || {};
					}
					frappe.meta.docfield_map['EDO Stamp Field Mapping']['document_field'].options = options;
				});
				
				// Обновляем все существующие строки
				if (frm.fields_dict.field_mappings && frm.fields_dict.field_mappings.grid) {
					frm.fields_dict.field_mappings.grid.grid_rows.forEach(function(row) {
						if (row.doc) {
							update_field_options_in_row(frm, 'EDO Stamp Field Mapping', row.doc.name);
						}
					});
				}
				
				if (callback) callback();
			}
		},
		error: function(r) {
			frm._document_fields_loading = false;
			console.error('Error loading document fields:', r);
			if (callback) callback();
		}
	});
}

function update_stamp_preview(frm) {
	// Обновляем превью штампа с заполненными полями
	if (!frm.doc.name || !frm.doc.stamp_image) {
		return;
	}
	
	// Используем debounce, чтобы не делать слишком много запросов
	if (frm._preview_update_timeout) {
		clearTimeout(frm._preview_update_timeout);
	}
	
	frm._preview_update_timeout = setTimeout(function() {
		frappe.call({
			method: 'edo.edo.doctype.edo_stamp.edo_stamp.get_stamp_preview',
			args: {
				stamp_name: frm.doc.name,
				show_text_area: true  // Показываем область текста в админке
			},
			callback: function(r) {
				if (r.message && frm.fields_dict.preview) {
					// Обновляем превью
					frm.fields_dict.preview.$wrapper.find('img').attr('src', r.message);
				}
			},
			error: function(r) {
				console.error('Failed to update stamp preview:', r);
			}
		});
	}, 500);
}
