from flask import request, jsonify
from flask_jwt_extended import jwt_required, current_user

from . import journals
from .models import JournalEntry, JournalSchema
from app import db


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
    
    data = request.get_json() or {}
    entry = JournalEntry(user_id=current_user.id, journal_type=journal_type, data=data)
    db.session.add(entry)
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
    data = request.get_json() or {}
    entry.data = data
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
    
    # Удаляем все записи этого типа журнала
    JournalEntry.query.filter_by(user_id=current_user.id, journal_type=schema.name).delete()
    db.session.delete(schema)
    db.session.commit()
    return jsonify({'result': 'OK'})
