<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Sale>
 */
class SaleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => 1, // سيتم override في الاختبارات
            'user_id' => 1, // سيتم override في الاختبارات
            'invoice_number' => 'INV-' . now()->format('Ymd') . '-' . str_pad(fake()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'total' => fake()->randomFloat(2, 10, 1000),
            'discount' => 0,
            'discount_type' => 'fixed',
            'payment_method' => fake()->randomElement(['cash', 'card', 'transfer']),
            'status' => 'completed',
        ];
    }
}
