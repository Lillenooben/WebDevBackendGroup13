<main>
    <h1>Create Group</h1>
    <form>
        <label for="gname">Group Name: </label>
        <input type="text" id="gname" name="gname" /><br>
        <label for="gimage">Group Image: </label>
        <input type="file" name="gimage" /><br>
        <button type="submit" class="submit-button">Create</button>
    </form>
</main>

<style>
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