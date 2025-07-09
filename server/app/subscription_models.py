from app import db
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DECIMAL, DateTime, Boolean, ForeignKey
from sqlalchemy.types import JSON

class AccessLevel(db.Model):
    __tablename__ = 'access_levels'
    __table_args__ = {'schema': 'users'}
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    description = Column(Text)
    max_containers = Column(Integer, default=3)
    features = Column(JSON)

class SubscriptionPlan(db.Model):
    __tablename__ = 'subscription_plans'
    __table_args__ = {'schema': 'users'}
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    price = Column(DECIMAL(10,2))
    access_level_id = Column(Integer, ForeignKey('users.access_levels.id'))
    duration_days = Column(Integer)

class UserSubscription(db.Model):
    __tablename__ = 'user_subscriptions'
    __table_args__ = {'schema': 'users'}
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.users.user_id')) 
    plan_id = Column(Integer, ForeignKey('users.subscription_plans.id'))  
    start_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_date = Column(DateTime)    
    is_active = Column(Boolean, default=True)