"""
Inventory App — Basic Tests
Run with: pytest test_app.py -v
"""

import json
import pytest
from app import app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_health_check(client):
    """Test the /health endpoint returns 200."""
    response = client.get('/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'


def test_get_products(client):
    """Test GET /products returns a list."""
    response = client.get('/products')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)


def test_add_product(client):
    """Test POST /products adds a new product."""
    new_product = {
        "name": "Test Product",
        "category": "Testing",
        "price": 9.99,
        "quantity": 5,
    }
    response = client.post(
        '/products',
        data=json.dumps(new_product),
        content_type='application/json',
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Product'
    assert 'id' in data


def test_add_product_no_name(client):
    """Test POST /products with missing name returns 400."""
    response = client.post(
        '/products',
        data=json.dumps({"price": 10}),
        content_type='application/json',
    )
    assert response.status_code == 400


def test_delete_product(client):
    """Test DELETE /products/<id> removes a product."""
    # First, add a product to delete
    new_product = {"name": "To Delete", "price": 1.0, "quantity": 1}
    add_response = client.post(
        '/products',
        data=json.dumps(new_product),
        content_type='application/json',
    )
    product_id = json.loads(add_response.data)['id']

    # Delete it
    del_response = client.delete(f'/products/{product_id}')
    assert del_response.status_code == 200


def test_delete_nonexistent_product(client):
    """Test DELETE with a fake ID returns 404."""
    response = client.delete('/products/nonexistent-id')
    assert response.status_code == 404
