<script>
    import { Link } from "svelte-routing"
    import Loader from "./Loader.svelte"

    let loading = false
    let username = ""
    let password = ""
    let confirmPassword = ""
    let errors = []
    let hasSucceeded = false

    async function createAcc() {
        loading = true
        errors = []
        hasSucceeded = false
        
        const data = {
            username: username,
            password: password,
            confirmPassword: confirmPassword,
        }

        try {
            const response = await fetch("http://localhost:8080/user/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })

            switch (response.status) {
                case 201:
                    hasSucceeded = true
                    break
                case 400:
                    const body = await response.json()
                    errors = body.errors
                    break
                case 500:
                    errors = ["Something went wrong"]
                    break
            }

            loading = false

        } catch(error) {
            console.log(error)
            loading = false
            errors = ["Something went wrong"]
        }
    }
</script>

<h1>Create account</h1>

{#if loading}
    <Loader/>
{:else if hasSucceeded}
    <p>Account created! <Link to="login">Click here to log in!</Link></p>
{/if}

{#each errors as error}
    <p class="error-text">{error}</p>
{/each}

<form on:submit|preventDefault={createAcc}>

    <div>
        <label for="username">Username: </label>
        <input type="text" name="username" bind:value={username}>
    </div>

    <div>
        <label for="password">Password: </label>
        <input type="password" name="password" bind:value={password}>
    </div>

    <div>
        <label for="confirm">Confirm password: </label>
        <input type="password" name="confirm" bind:value={confirmPassword}>
    </div>

    <button type="submit" class="submit-button">Create</button>

</form>

<style>
    .error-text {
        color: red;
        margin: 0.2em;
    }
    p:last-of-type {
        margin-bottom: 1em;
    }
    input {
        width: 19.1em;
        padding: 8px 14px;
        margin: 8px 0;
        box-sizing: border-box;
    }
    .submit-button {
        margin-top: 0.5em;
    }
</style>