#include <stdio.h>
#include <stdbool.h>

// Function to check if a number is prime
bool isPrime(int num) {
    if (num < 2) return false;
    for (int i = 2; i * i <= num; i++) {
        if (num % i == 0) return false;
    }
    return true;
}

int main() {
    int n, count = 0, num = 1, nthPrime;

    printf("Enter n (to find the nth prime): ");
    scanf("%d", &n);

    while (count < n) {
        num++;
        if (isPrime(num)) {
            count++;
        }
    }

    nthPrime = num;
    printf("The %dth prime number is %d\n", n, nthPrime);

    return 0;
}

