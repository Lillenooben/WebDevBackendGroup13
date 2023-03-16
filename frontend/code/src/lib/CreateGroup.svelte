<script>
    import { navigate } from "svelte-routing"
    import { user } from "../user-store.js"

    let groupName = ""
    let error = ""

    async function createGroup(){
        error = ""

        const data = {
            groupName: groupName,
        }
        
        try {

            const response = await fetch("http://localhost:8080/group/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
					"Authorization": "Bearer "+$user.accessToken,
                },
                body: JSON.stringify(data)
            })

            const body = await response.json()

            switch(response.status) {
                case 201:
                    navigate(`group/${body.newGroupID}`)
                    break
                case 400:
                    error = body.error
                    break
                case 401:
                    error = body.error
                    break
                case 500:
                    error = body.error
                    break
            }

        }catch(error){
            console.log(error)
        }
    }

</script>


<h1>Create Group</h1>

<p class="error-text">{error}</p>

<form on:submit|preventDefault={createGroup}>

    <div>
        <label for="gname">Group Name: </label>
        <input type="text" id="gname" name="gname" bind:value={groupName}/>
    </div>

    <div>
        <label for="gimage">Group Image: </label>
        <input type="file" accept="image/png, image/jpeg" name="gimage"/>
    </div>

    <button type="submit" class="submit-button">Create</button>
</form>


<style>
    .error-text {
        color: red
    }
    #gname {
        width: 19.1em;
        padding: 8px 14px;
        margin: 8px 0;
        box-sizing: border-box;
    }
    .submit-button {
        margin-top: 1em;
    }
</style>