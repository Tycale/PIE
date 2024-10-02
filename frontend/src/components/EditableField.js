import React, { useState } from 'react';
import { FaPencilAlt } from 'react-icons/fa';
import './EditableField.css';

const EditableField = ({ value, onChange, fieldName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const placeholders = {
    name: 'Enter name',
    account: 'Enter account number',
    amount: 'Enter amount',
    communication: 'Enter communication'
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(localValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className={`editable-field ${isEditing ? 'editing' : ''}`} onClick={handleEdit}>
      {isEditing ? (
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="editable-field-input"
          placeholder={placeholders[fieldName]}
        />
      ) : (
        <>
          <span className="editable-field-value">
            {value !== '' ? value : <span className="placeholder">{placeholders[fieldName]}</span>}
          </span>
          <FaPencilAlt className="editable-field-icon" />
        </>
      )}
    </div>
  );
};

export default EditableField;
