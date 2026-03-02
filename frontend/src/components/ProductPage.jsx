import React from 'react';
import { useParams } from 'react-router-dom';

export default function ProductPage() {
  const { id } = useParams();
  return (
    <div>
      <h2>Product {id}</h2>
      {/* details here */}
    </div>
  );
}
