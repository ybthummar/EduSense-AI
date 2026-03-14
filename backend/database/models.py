from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database.connection import Base  # noqa: F401 – Base is the SQLAlchemy declarative base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, faculty, student
    name = Column(String, nullable=True)

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class Faculty(Base):
    __tablename__ = "faculty"
    faculty_id = Column(String, primary_key=True, index=True)
    department = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    user = relationship("User")
    students = relationship("Student", back_populates="faculty_rel")

class Student(Base):
    __tablename__ = "students"
    student_id = Column(String, primary_key=True, index=True)
    department = Column(String)
    semester = Column(Integer)
    faculty_id = Column(String, ForeignKey("faculty.faculty_id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    user = relationship("User")
    faculty_rel = relationship("Faculty", back_populates="students")
    marks = relationship("Marks", back_populates="student")
    attendance = relationship("Attendance", back_populates="student")
    risk_score = relationship("RiskScore", back_populates="student", uselist=False)

class Marks(Base):
    __tablename__ = "marks"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id"))
    subject = Column(String)
    score = Column(Float)
    
    student = relationship("Student", back_populates="marks")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id"))
    total_classes = Column(Integer)
    attended_classes = Column(Integer)
    percentage = Column(Float)
    
    student = relationship("Student", back_populates="attendance")

class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id"), unique=True)
    score = Column(Float)
    risk_level = Column(String) # Low, Medium, High, Critical
    factors = Column(JSON)
    
    student = relationship("Student", back_populates="risk_score")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question = Column(String)
    response = Column(String)
    timestamp = Column(String)

class YouTubeRecommendation(Base):
    __tablename__ = "youtube_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True)
    video_details = Column(JSON) # Array of {title, url, thumbnail}
