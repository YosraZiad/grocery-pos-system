<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $tenantId = config('tenant_id');
        
        return [
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where(function ($query) use ($tenantId) {
                    $query->where('tenant_id', $tenantId);
                }),
            ],
            'name' => 'required|string|max:255',
            'barcode' => [
                'nullable',
                'string',
                Rule::unique('products', 'barcode')->where(function ($query) use ($tenantId) {
                    $query->where('tenant_id', $tenantId);
                }),
            ],
            'description' => 'nullable|string',
            'unit_id' => 'nullable|integer|min:1',
            'provider' => 'nullable|string|max:255',
            'purchase_price' => 'nullable|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|integer|min:0',
            'expiry_date' => 'nullable|date',
            'min_stock_alert' => 'nullable|integer|min:0',
            'min_expiry_alert' => 'nullable|integer|min:0',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category_id.required' => 'Category is required',
            'category_id.exists' => 'Selected category does not exist',
            'name.required' => 'Product name is required',
            'name.string' => 'Product name must be a string',
            'name.max' => 'Product name must not exceed 255 characters',
            'barcode.unique' => 'Barcode already exists',
            'description.string' => 'Description must be a string',
            'unit_id.integer' => 'Unit ID must be an integer',
            'unit_id.min' => 'Unit ID must be greater than 0',
            'provider.string' => 'Provider must be a string',
            'provider.max' => 'Provider must not exceed 255 characters',
            'purchase_price.numeric' => 'Purchase price must be a number',
            'purchase_price.min' => 'Purchase price must be at least 0',
            'sale_price.numeric' => 'Sale price must be a number',
            'sale_price.min' => 'Sale price must be at least 0',
            'quantity.integer' => 'Quantity must be an integer',
            'quantity.min' => 'Quantity must be at least 0',
            'expiry_date.date' => 'Expiry date must be a valid date',
            'min_stock_alert.integer' => 'Minimum stock alert must be an integer',
            'min_stock_alert.min' => 'Minimum stock alert must be at least 0',
            'min_expiry_alert.integer' => 'Minimum expiry alert must be an integer',
            'min_expiry_alert.min' => 'Minimum expiry alert must be at least 0',
        ];
    }
}
