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
            'purchase_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
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
            'purchase_price.required' => 'Purchase price is required',
            'purchase_price.numeric' => 'Purchase price must be a number',
            'purchase_price.min' => 'Purchase price must be at least 0',
            'sale_price.required' => 'Sale price is required',
            'sale_price.numeric' => 'Sale price must be a number',
            'sale_price.min' => 'Sale price must be at least 0',
            'quantity.required' => 'Quantity is required',
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
