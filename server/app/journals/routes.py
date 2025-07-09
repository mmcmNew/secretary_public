import os
import uuid
from werkzeug.utils import secure_filename
from flask import request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, current_user

from . import journals
from .models import JournalEntry, JournalSchema, JournalFile
from app import db
from flask import current_app


@journals.route('/<journal_type>', methods=['GET'])
@jwt_required()
def get_journals(journal_type):
    # Проверяем, что у пользователя есть доступ к этому типу журнала
    schema = JournalSchema.query.filter_by(user_id=current_user.id, name=journal_type).first()
    if not schema:
        return jsonify({'error': 'Журнал не найден'}), 404
    
    entries = JournalEntry.query.filter_by(user_id=current_user.id, journal_type=journal_type).all()
    return jsonify([e.to_dict() for e in entries])


@journals.route('/<journal_type>', methods=['POST'])
@jwt_required()
def create_journal(journal_type):
    # Проверяем, что у пользователя есть доступ к этому типу журнала
    schema = JournalSchema.query.filter_by(user_id=current_user.id, name=journal_type).first()
    if not schema:
        return jsonify({'error': 'Журнал не найден'}), 404
    
    # Получаем данные из формы или JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        files = request.files
    else:
        data = request.get_json() or {}
        files = {}
    
    entry = JournalEntry(user_id=current_user.id, journal_type=journal_type, data=data)
    db.session.add(entry)
    db.session.flush()  # Получаем ID записи
    
    # Обрабатываем файлы для полей типа 'file'
    _process_journal_files(entry, schema, files)
    
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@journals.route('/<journal_type>/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_journal(journal_type, entry_id):
    # Проверяем, что у пользователя есть доступ к этому типу журнала
    schema = JournalSchema.query.filter_by(user_id=current_user.id, name=journal_type).first()
    if not schema:
        return jsonify({'error': 'Журнал не найден'}), 404
    
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=current_user.id, journal_type=journal_type).first_or_404()
    
    # Получаем данные из формы или JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        files = request.files
    else:
        data = request.get_json() or {}
        files = {}
    
    entry.data = data
    
    # Обрабатываем новые файлы
    _process_journal_files(entry, schema, files)
    
    db.session.commit()
    return jsonify(entry.to_dict())


@journals.route('/<journal_type>/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_journal(journal_type, entry_id):
    # Проверяем, что у пользователя есть доступ к этому типу журнала
    schema = JournalSchema.query.filter_by(user_id=current_user.id, name=journal_type).first()
    if not schema:
        return jsonify({'error': 'Журнал не найден'}), 404
    
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=current_user.id, journal_type=journal_type).first_or_404()
    
    # Удаляем физические файлы
    for file in entry.files:
        file.delete_file()
    
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'result': 'OK'})


# Маршруты для управления схемами журналов
@journals.route('/schemas', methods=['GET'])
@jwt_required()
def get_schemas():
    schemas = JournalSchema.query.filter_by(user_id=current_user.id).all()
    return jsonify([s.to_dict() for s in schemas])


@journals.route('/schemas', methods=['POST'])
@jwt_required()
def create_schema():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('display_name') or not data.get('fields'):
        return jsonify({'error': 'Необходимы поля: name, display_name, fields'}), 400
    
    # Проверяем уникальность имени для пользователя
    existing = JournalSchema.query.filter_by(user_id=current_user.id, name=data['name']).first()
    if existing:
        return jsonify({'error': 'Журнал с таким именем уже существует'}), 400
    
    schema = JournalSchema(
        user_id=current_user.id,
        name=data['name'],
        display_name=data['display_name'],
        fields=data['fields']
    )
    db.session.add(schema)
    db.session.commit()
    return jsonify(schema.to_dict()), 201


@journals.route('/schemas/<int:schema_id>', methods=['PUT'])
@jwt_required()
def update_schema(schema_id):
    schema = JournalSchema.query.filter_by(id=schema_id, user_id=current_user.id).first_or_404()
    
    if schema.is_default:
        return jsonify({'error': 'Нельзя редактировать системный журнал'}), 403
    
    data = request.get_json()
    if data.get('display_name'):
        schema.display_name = data['display_name']
    if data.get('fields'):
        schema.fields = data['fields']
    
    db.session.commit()
    return jsonify(schema.to_dict())


@journals.route('/schemas/<int:schema_id>', methods=['DELETE'])
@jwt_required()
def delete_schema(schema_id):
    schema = JournalSchema.query.filter_by(id=schema_id, user_id=current_user.id).first_or_404()
    
    if schema.is_default:
        return jsonify({'error': 'Нельзя удалить системный журнал'}), 403
    
    # Удаляем все записи этого типа журнала и связанные файлы
    entries = JournalEntry.query.filter_by(user_id=current_user.id, journal_type=schema.name).all()
    for entry in entries:
        for file in entry.files:
            file.delete_file()
    JournalEntry.query.filter_by(user_id=current_user.id, journal_type=schema.name).delete()
    db.session.delete(schema)
    db.session.commit()
    return jsonify({'result': 'OK'})


def _get_upload_path(user_id, journal_type):
    """Получаем путь для загрузки файлов журнала"""
    upload_path = os.path.join(
        current_app.instance_path,
        'uploads',
        f'user_{user_id}',
        'journals',
        journal_type,
    )
    os.makedirs(upload_path, exist_ok=True)
    return upload_path


def _process_journal_files(entry, schema, files):
    """Обрабатываем файлы для полей типа 'file'"""
    if not files:
        return
    
    # Находим поля типа 'file' в схеме
    file_fields = [f for f in schema.fields if f.get('type') == 'file']
    
    for field in file_fields:
        field_name = field['name']
        if field_name in files:
            file_list = files.getlist(field_name)
            for file in file_list:
                if file and file.filename:
                    # Генерируем уникальное имя файла
                    file_ext = os.path.splitext(file.filename)[1]
                    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
                    
                    # Определяем путь для сохранения
                    upload_path = _get_upload_path(entry.user_id, entry.journal_type)
                    file_path = os.path.join(upload_path, unique_filename)
                    rel_path = os.path.relpath(
                        file_path,
                        os.path.join(current_app.instance_path, 'uploads')
                    )
                    
                    # Сохраняем файл
                    file.save(file_path)
                    
                    # Создаем запись в базе
                    journal_file = JournalFile(
                        entry_id=entry.id,
                        field_name=field_name,
                        filename=unique_filename,
                        original_filename=secure_filename(file.filename),
                        file_path=rel_path,
                        file_size=os.path.getsize(file_path),
                        mime_type=file.content_type
                    )
                    db.session.add(journal_file)


@journals.route('/<journal_type>/<int:entry_id>/files/<int:file_id>', methods=['GET'])
@jwt_required()
def download_journal_file(journal_type, entry_id, file_id):
    """Скачивание файла журнала"""
    # Проверяем доступ
    entry = JournalEntry.query.filter_by(
        id=entry_id, 
        user_id=current_user.id, 
        journal_type=journal_type
    ).first_or_404()
    
    journal_file = JournalFile.query.filter_by(
        id=file_id, 
        entry_id=entry_id
    ).first_or_404()
    
    abs_path = os.path.join(current_app.instance_path, 'uploads', journal_file.file_path)
    if not os.path.exists(abs_path):
        return jsonify({'error': 'Файл не найден'}), 404

    directory = os.path.dirname(abs_path)
    filename = os.path.basename(abs_path)
    
    # Если передан параметр raw=1, отображаем файл в браузере
    raw = request.args.get('raw') == '1'
    return send_from_directory(
        directory,
        filename,
        as_attachment=not raw,
        download_name=journal_file.original_filename
    )


@journals.route('/<journal_type>/<int:entry_id>/files/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_journal_file(journal_type, entry_id, file_id):
    """Удаление файла журнала"""
    # Проверяем доступ
    entry = JournalEntry.query.filter_by(
        id=entry_id, 
        user_id=current_user.id, 
        journal_type=journal_type
    ).first_or_404()
    
    journal_file = JournalFile.query.filter_by(
        id=file_id, 
        entry_id=entry_id
    ).first_or_404()
    
    # Удаляем физический файл
    journal_file.delete_file()
    
    # Удаляем запись из базы
    db.session.delete(journal_file)
    db.session.commit()
    
    return jsonify({'result': 'OK'})
