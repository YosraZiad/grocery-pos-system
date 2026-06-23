<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

class PinAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test user under the setup tenant
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'pin' => Hash::make('1234'),
        ]);
    }

    public function test_user_can_update_pin_successfully()
    {
        Sanctum::actingAs($this->user);

        $response = $this->putJson('/api/auth/pin', [
            'pin' => '5566',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'PIN updated successfully',
            ]);

        $this->user->refresh();
        $this->assertTrue(Hash::check('5566', $this->user->pin));
    }

    public function test_user_cannot_update_pin_with_invalid_data()
    {
        Sanctum::actingAs($this->user);

        // Not 4 digits
        $response = $this->putJson('/api/auth/pin', [
            'pin' => '123',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['pin']);

        // Letters instead of numbers
        $response = $this->putJson('/api/auth/pin', [
            'pin' => 'abcd',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['pin']);
    }

    public function test_user_can_verify_pin_successfully()
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/auth/verify-pin', [
            'pin' => '1234',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'PIN verified successfully',
            ]);
    }

    public function test_user_cannot_verify_incorrect_pin()
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/auth/verify-pin', [
            'pin' => '9999',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid PIN',
            ]);
    }

    public function test_pin_is_hidden_from_api_response()
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(200);
        $this->assertArrayNotHasKey('pin', $response->json('user'));
    }
}
